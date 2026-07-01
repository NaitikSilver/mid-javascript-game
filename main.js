import { isWalkable, generateWorld, tiles, generateEnemies, Tile, level, boss , tileEffects} from "./generateWorld.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT, tileset, entitysheet, drawWorld, TILE_SIZE, statusiconset, EnemyMinimap } from "./render.js";

import { Entity, entityAtTile, player, entities, statusTime, statusList, entityStats, EntityType, setPlayer, ENTITY_SRC_SIZE } from "./entity.js";
import { inventory, items, inRange, Shop, itemStats, inRangeSpecial, Item } from "./item.js";

// variables
let turnCount = 0;
let attack_x = 0;
let attack_y = 0;
let intro = true;
let intro_selected = 0;

let shop = new Shop([]);


function updateWorld() {
	//if enemy is on trap apply effect
	for (let i = 0; i < entities.length; i++) {
		if (tiles[entities[i].y][entities[i].x] > Tile.EMPTY && tiles[entities[i].y][entities[i].x] < Tile.STAIRS) {
			entities[i].effects[tiles[entities[i].y][entities[i].x]-17] += statusTime[tiles[entities[i].y][entities[i].x]-17];
			tiles[entities[i].y][entities[i].x] = 11; //reset tile to floor
		}
	}

	for (let i = 0; i<tileEffects.length; i++) {
		if (turnCount - tileEffects[i].applied > tileEffects[i].t) {
			tileEffects.splice(i--, 1);
		} else {
			for (let j =0; j < entities.length; j++) {
				if (Math.abs(entities[j].x-tileEffects[i].x)+Math.abs(entities[j].y-tileEffects[i].y) <= tileEffects[i].size-1) {
					if (tileEffects[i].status == Tile.TRAP_FIRE)
						entities[j].effects[statusList.FIRE] += 2
					if (tileEffects[i].status == Tile.TRAP_POISON)
						entities[j].effects[statusList.POISON] += 4
				}
			}
		}
	}


	if (tiles[player.y][player.x] == Tile.STAIRS && boss.health <= 0) {
		generateWorld();
		return;
	}
	
	player.update();
	EnemyMinimap();
	//turn based system
	for (let i = 1; i < entities.length; i++)
		entities[i].turn();
	if (turnCount % 250 == 0)
		generateEnemies();
	turnCount++;
	player.applyarmor()
	
}

//-------------------------KEYBOARD KEYS-------------------------
window.keyPressed = () => {
	if (intro) {
		if (keyCode == ENTER) {
			if (intro_selected == 0)
				setPlayer(new Entity(0, 0, EntityType.WARRIOR, 1, [Item.SWORD]));
			else if (intro_selected == 1)
				setPlayer(new Entity(0, 0, EntityType.ARCHER, 1, [Item.BOW]));
			else if (intro_selected == 2)
				setPlayer(new Entity(0, 0, EntityType.WIZARD, 1, [Item.FIRE_WAND, Item.POISON_WAND]));
			generateWorld();
			intro = false;
		}
		if (keyCode == LEFT_ARROW && intro_selected > 0)
			intro_selected--;
		if (keyCode == RIGHT_ARROW && intro_selected < 2)
			intro_selected++;
		return;
	}
	if (player.health <= 0)
		window.location.reload();
	// Key X / Inventory
	// if x is pressed and the inventory is not open 
	if (key == 'x' || key == 'X') {
		inventory.toggle();
	}

	if (shop.open) {
		if (keyCode == UP_ARROW)
			shop.selection_up();
		else if (keyCode == DOWN_ARROW)
			shop.selection_down();
	}
	else if (inventory.open) {
		if (keyCode == UP_ARROW)
			inventory.selection_up();
		else if (keyCode == DOWN_ARROW)
			inventory.selection_down();
		else if (keyCode == LEFT_ARROW)
			inventory.selection_left();
		else if (keyCode == RIGHT_ARROW)
			inventory.selection_right();
	}
	else if (player.quickslot[player.selected]) {
		if (itemStats[player.quickslot[player.selected]].directional) {
			let arrow = true;
			if (keyCode == UP_ARROW)
				player.attackAt(entityAtTile(player.x, player.y-1), 0, -1, keyIsDown(SHIFT));
			else if (keyCode == DOWN_ARROW)
				player.attackAt(entityAtTile(player.x, player.y+1), 0, 1, keyIsDown(SHIFT));
			else if (keyCode == LEFT_ARROW)
				player.attackAt(entityAtTile(player.x-1, player.y), -1, 0, keyIsDown(SHIFT));
			else if (keyCode == RIGHT_ARROW)
				player.attackAt(entityAtTile(player.x+1, player.y), 1, 0, keyIsDown(SHIFT));
			else {
				arrow = false;
			}
			if (arrow) {
				updateWorld();
				return;
			}
		}
		else {
			if (keyCode == UP_ARROW)
				attack_y -= 1;
			else if (keyCode == DOWN_ARROW)
				attack_y += 1;
			else if (keyCode == LEFT_ARROW)
				attack_x -= 1;
			else if (keyCode == RIGHT_ARROW)
				attack_x += 1;
		}
	}

	// move up
	if ((key == 'w' || key == 'W') && isWalkable[tiles[player.y-1][player.x]]) {
		let e = entityAtTile(player.x, player.y-1);
		if (e == null) {
			if (player.effects[statusList.VINES] == 0 && player.effects[statusList.STUN] == 0)
				player.y -= 1
		}
		else
			player.attackAt(e, 0, -1, key == 'W');
		updateWorld();
	}
	// move down
	if ((key == 's' || key == 'S') && isWalkable[tiles[player.y+1][player.x]]) {
		let e = entityAtTile(player.x, player.y+1);
		if (e == null) {
			if (player.effects[statusList.VINES] == 0 && player.effects[statusList.STUN] == 0)
				player.y += 1
		}
		else
			player.attackAt(e, 0, 1, key == 'S');
		updateWorld();
	}
	// move left
	if ((key == 'a' || key == 'A') && isWalkable[tiles[player.y][player.x-1]]) {
		let e = entityAtTile(player.x-1, player.y);
		if (e == null) {
			if (player.effects[statusList.VINES] == 0 && player.effects[statusList.STUN] == 0)
				player.x -= 1
		}
		else
			player.attackAt(e, -1, 0, key == 'A');
		updateWorld();
	}
	// move right
	if ((key == 'd' || key == 'D') && isWalkable[tiles[player.y][player.x+1]]) {
		let e = entityAtTile(player.x+1, player.y);
		if (e == null) {
			if (player.effects[statusList.VINES] == 0 && player.effects[statusList.STUN] == 0)
				player.x += 1
		}
		else
			player.attackAt(e, 1, 0, key == 'D');
		updateWorld();
	}
	let e = entityAtTile(player.x+attack_x, player.y+attack_y);
	if (key == 'e' || key == 'E') {
		if (e != null) {
			if (e.type == EntityType.MERCHANT) {
				shop = e.shop;
				shop.open = !shop.open;
			}
			else if (!itemStats[player.quickslot[player.selected]].directional) {
				player.attackAt(e, attack_x, attack_y, key == 'E');
				updateWorld();
			}
		}
	}
	if (key == 'o' || key == 'O') {
		if (items[player.y][player.x] != null) {
			inventory.add(items[player.y][player.x]);
			items[player.y][player.x] = null;
			updateWorld();
		}
	}
	if (key == '1' || key == '!')
		player.selected = 0;
	else if (key == '2' || key == '@')
		player.selected = 1;
	else if (key == '3' || key == '#')
		player.selected = 2;
	else if (key == '4' || key == '$')
		player.selected = 3;
	//reload
	else if (key == "r") {
		window.location.reload()
	}

	// use item in inventory
	if (keyCode == ENTER && inventory.items[inventory.selected] != null && inventory.open) {
		player.use(inventory.remove_selected());
		updateWorld();
	}
	if (keyCode == ENTER && shop.open) {
		shop.buy()
		updateWorld();
	}
	if (keyCode == BACKSPACE && !inventory.open && player.quickslot[player.selected] != null) {
		inventory.add(player.quickslot.splice(player.selected, 1)[0]);
		updateWorld();
	}
	if (keyCode == BACKSPACE && inventory.open && inventory.items[inventory.selected] != null) {
		items[player.y][player.x] = inventory.remove_selected();
		updateWorld();
	}
}

//SETUP 
window.setup = () => {
	createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
	noSmooth(); // Turns off filter on images because we want clear pixel art
}
//mousclick
window.mouseClicked = () => {
}

//DRAW
window.draw = () => {
	background(20);
	if (intro) {
		fill(0);
		rect(150, 150, CANVAS_WIDTH-300, CANVAS_HEIGHT-300);
		noStroke();
		textSize(32);
		fill(255);
		text("Choose your class:", 250, 250);
		image(entitysheet, 250, 300, 4*ENTITY_SRC_SIZE, 4*ENTITY_SRC_SIZE, EntityType.WARRIOR*ENTITY_SRC_SIZE, 0, ENTITY_SRC_SIZE, ENTITY_SRC_SIZE);
		image(entitysheet, 350, 300, 4*ENTITY_SRC_SIZE, 4*ENTITY_SRC_SIZE, EntityType.ARCHER*ENTITY_SRC_SIZE, 0, ENTITY_SRC_SIZE, ENTITY_SRC_SIZE);
		image(entitysheet, 450, 300, 4*ENTITY_SRC_SIZE, 4*ENTITY_SRC_SIZE, EntityType.WIZARD*ENTITY_SRC_SIZE, 0, ENTITY_SRC_SIZE, ENTITY_SRC_SIZE);
		stroke(0, 0, 255);
		fill(0, 0, 0, 0);
		strokeWeight(4);
		rect(250 + 100*intro_selected, 300, 4*ENTITY_SRC_SIZE, 4*ENTITY_SRC_SIZE);
	}
	else
		drawWorld(player.x, player.y);
}


export { turnCount, attack_x, attack_y, shop };

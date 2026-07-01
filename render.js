import { WORLD_WIDTH, WORLD_HEIGHT, tiles , level, isWalkable, tileEffects, Tile} from "./generateWorld.js";
import { entities, player, entityStats, statusTime, EntityType} from "./entity.js";
import { turnCount, attack_x, attack_y, shop } from "./main.js";
import { items, Item,itemInRoom, inventory, itemStats, ITEM_SRC_SIZE, inRange, inRangeSpecial } from "./item.js" 

// CONSTANTS
const CANVAS_WIDTH = 768;  // Width of p5 canvas
const CANVAS_HEIGHT = 768; // Height of p5 canvas
const TILE_SRC_SIZE = 16;  // Size of tile in tile atlas
const TILE_SIZE = 32;      // Rendered size of tile

// sprite sheet variables
let tileset;                // Stores our tileset image
let entitysheet;            // Stores our entity tilesheet image
let itemset;				// Stores our item tilesheet image
let statusiconset;		// Stores our status icon tilesheet image
let minimap;

// Preloads our images
window.preload = () => { 
	tileset = loadImage("./assets/tileset_1.png");
	itemset = loadImage("./assets/itemset.png");
	entitysheet = loadImage("./assets/entitySheet.png");
	statusiconset = loadImage("./assets/statusicons.png");
	minimap = createImage(WORLD_WIDTH, WORLD_HEIGHT);
}

//showcases a mini-map 
function fillMinimap() {
	minimap.loadPixels();
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			if (isWalkable[tiles[y][x]]) {
				minimap.set(x, y, [0, 0, 0, 255]);
			}
			else
				minimap.set(x, y, [255, 255, 255, 255]);
		}
	}
	minimap.updatePixels();
}

function EnemyMinimap() {
	minimap.loadPixels()
	for (let i = 0; i < entities.length; i++) {			
		if (entities[i].type == EntityType.MERCHANT) {
			minimap.set(entities[i].x, entities[i].y, [0, 255, 0, 255])
		} else if (entities[i].type == EntityType.BOSS) {
			minimap.set(entities[i].x, entities[i].y, [255, 0, 0, 255])
		} else {
			minimap.set(entities[i].x, entities[i].y, [255, 255, 255, 255])
		}				
	}
	minimap.set(player.x, player.y, [255,233,0, 255])
	minimap.updatePixels();
}

function drawRow(tx, ty, s, tile) {
	let x = (tx-player.x-1+VIEWPORT_WIDTH/2)*TILE_SIZE;
	let y = (ty-player.y-1+VIEWPORT_HEIGHT/2)*TILE_SIZE;
	
	// move to the draw tile function if have time
	image(tileset, x, y, TILE_SIZE, TILE_SIZE, tile*TILE_SRC_SIZE, 0, TILE_SRC_SIZE, TILE_SRC_SIZE);
	for (let k = 1; k < s; k++) {
		x = (tx-player.x-1+VIEWPORT_WIDTH/2)*TILE_SIZE;
		y = (ty-player.y+k-1+VIEWPORT_HEIGHT/2)*TILE_SIZE;
		image(tileset, x, y, TILE_SIZE, TILE_SIZE, tile*TILE_SRC_SIZE, 0, TILE_SRC_SIZE, TILE_SRC_SIZE);
		y = (ty-player.y-k-1+VIEWPORT_HEIGHT/2)*TILE_SIZE;
		image(tileset, x, y, TILE_SIZE, TILE_SIZE, tile*TILE_SRC_SIZE, 0, TILE_SRC_SIZE, TILE_SRC_SIZE);
	}
}

function drawTileStatus() {
	for (let i = 0; i < tileEffects.length; i++) {
	
		drawRow(tileEffects[i].x, tileEffects[i].y, tileEffects[i].size, tileEffects[i].status)
		for (let k = 1; k < tileEffects[i].size; k++) {
			drawRow(tileEffects[i].x-k, tileEffects[i].y, tileEffects[i].size-k, tileEffects[i].status)
			drawRow(tileEffects[i].x+k, tileEffects[i].y, tileEffects[i].size-k, tileEffects[i].status)
		}
	}
}


let damageMarkers = []; // hold relivent info to make the damage float

// function that draws the inventory
function drawInvent() {
	// check if the inventory is open
	if (inventory.open) {
		// inventory asthetics
		let i_x = 150;
		let i_y = 150;
		const stat_x = CANVAS_WIDTH-TILE_SIZE*9;
		fill(100, 100, 100);
		rect(i_x, i_y, TILE_SIZE*9, TILE_SIZE*6.5);
		fill(255);
		textSize(40);
		text("Inventory", i_x + 60 , i_y + 50);
		// draw slots in intevntory (3 * 6 slots)
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 6; j++) {
				fill(255);
				rect(i_x + 7.5 +(j*TILE_SIZE*1.5), i_y + 65 +(i*TILE_SIZE*1.5), TILE_SIZE, TILE_SIZE);
				for (let e = 0; e < inventory.equipped.length; e++ ) {
					if (i**6 + j == inventory.equipped[e]) {
						fill(56, 255, 20)
						rect(i_x + 7.5 +(j*TILE_SIZE*1.5), i_y + 65 +(i*TILE_SIZE*1.5), TILE_SIZE, TILE_SIZE);
					}
				}
				// highlight the selected item (turn slot blue)
				if (i*6 + j == inventory.selected) {
					fill(40, 60, 255);
					rect(i_x + 7.5 +(j*TILE_SIZE*1.5), i_y + 65 +(i*TILE_SIZE*1.5), TILE_SIZE, TILE_SIZE);
				} 

				//if there is an item in the array draw it on the slot
				if (inventory.items[i*6 + j] != null)
					drawItems(inventory.items[i*6 + j], i_x + 7.5 +(j*TILE_SIZE*1.5), i_y + 65 +(i*TILE_SIZE*1.5));

			}
		}
		fill(160, 255, 200);
		rect(i_x + 7.5, i_y + 65 - TILE_SIZE*1.5, TILE_SIZE, TILE_SIZE);
		if (player.armor != null)
			drawItems(player.armor, i_x + 7.5, i_y + 65 - TILE_SIZE*1.5);
		rect(i_x + 7.5 + 5*TILE_SIZE*1.5, i_y + 65 - TILE_SIZE*1.5, TILE_SIZE, TILE_SIZE);
		if (player.leggings != null)
			drawItems(player.leggings, i_x + 7.5 + 5*TILE_SIZE*1.5, i_y + 65 - TILE_SIZE*1.5);
		//show item stats of selected item on the right side of the screen
		//show item stats of selected item on the right side of the screen
		fill(0);
		rect(stat_x, 0, TILE_SIZE*9, TILE_SIZE*9);
		fill(255);
		textSize(20);
		text("Level: " + player.lvl, stat_x, 20);
		text("Xp: " + player.xp, stat_x, 40);
		text("Health: " + player.health.toFixed(2), stat_x, 60);
		text("Max Health: " + player.max_health, stat_x, 80);
		text("Attack base: " + player.attack_base*player.lvl.toFixed(2), stat_x, 100);
		text("Defense base: " + player.defense_base*player.lvl.toFixed(2), stat_x, 120);
		text("Ranged base: " + player.ranged_base*player.lvl.toFixed(2), stat_x, 140);
		text("Attack mult: " + player.attack_mult.toFixed(2), stat_x, 160);
		text("Ranged mult: " + player.ranged_mult.toFixed(2), stat_x, 180);
		text("Defense mult: " + player.defense_mult.toFixed(2), stat_x, 200);
		if (inventory.items[inventory.selected])
			text("Item Selected: " + itemStats[inventory.items[inventory.selected]].name, stat_x, 220);
		text("X Location: " + player.x, stat_x, 240)
		text("Y Location: " + player.y, stat_x, 260)

		image(minimap, CANVAS_WIDTH-256, CANVAS_HEIGHT-256);
	}
}

// draws HEALTH BAR of the player
function drawHealthbar() {
	noStroke()
	fill(255, 0, 0)
	rect(0, 675, (player.health/entities[0].max_health) * 200, 15)
	stroke(0)
	strokeWeight(4)
	noFill()
	rect(0, 675, 200, 15)
	noStroke()
} 

function drawRestart() {
	//if the player health is 0, draw death screen
	if (player.health <= 0) {
		fill(0)
		strokeWeight(4)
		textSize(64)
		text("DEAD",CANVAS_WIDTH/2-64,CANVAS_HEIGHT/2)
		textSize(32);
		text("ANY KEY TO RESTART",CANVAS_WIDTH/2-132,CANVAS_HEIGHT/2+90)
	}
}

//draws the QUICK SLOT for equiped in the bottom of the screen
function drawQuickslot() {
	fill(0)
	rect(0, CANVAS_HEIGHT-70, 250, 70)
	// draws the 4 slots
	for (let i = 0; i < 4; i++) {
		fill(255)
		if (player.selected == i)
			fill(100, 200, 200);
		rect(10 + i*60, CANVAS_HEIGHT-55, 50, 50)
		if (player.quickslot[i])
			image(itemset, 10 + i*60, CANVAS_HEIGHT-55, TILE_SIZE*1.5, TILE_SIZE*1.5, player.quickslot[i]*ITEM_SRC_SIZE, 0, ITEM_SRC_SIZE, ITEM_SRC_SIZE)
	} // draws the squares 4 times
	fill(125, 150, 150);
	rect(10 + 4*60, CANVAS_HEIGHT-45, 50, 50)
	fill(0);
	textSize(32);
	text(player.mana + "/" + entityStats[player.type].mana, 10 + 4*60, CANVAS_HEIGHT-35, 50, 50);
} // draws the quick slots in the bottom

// draws the SHOP if the player is close to the merchant
function drawShop() {
	if (shop.open) {
		
		fill(0)
		rect(100, 60, 350, 540)
		fill(255)
		text("Shop", 240, 95)
		// has 6 vertical slots
		for (let i = 0; i < 6; i++) {
			fill(255)
			rect(110, 110 + i*80, 70, 70)
			
			try {
				text("Cost: "+ itemStats[shop.items[i]].cost, 190, 130 + i*80)
			} catch {}

			if (i == shop.selected) {
				fill(40, 60, 255);
				rect(110, 110 + i*80, 70, 70)
			} 

			if (shop.items[i]) 
				image(itemset, 110, 110 + i*80, TILE_SIZE*2, TILE_SIZE*2, shop.items[i]*ITEM_SRC_SIZE, 0, ITEM_SRC_SIZE, ITEM_SRC_SIZE)
			
		}
	}
}

// display DAMAGE number for entities and player
function drawDamageMarker(damageMarker) {
	fill(damageMarker.color)
	textSize(15);
	let x = (damageMarker.entity.x-player.x-1+VIEWPORT_WIDTH/2)*TILE_SIZE;
	let y = (damageMarker.entity.y-player.y-1+VIEWPORT_HEIGHT/2)*TILE_SIZE;
	text(damageMarker.damage.toFixed(2), x, y-(millis()-damageMarker.time)/100, 100)
	fill(0,0,0)
} // displayes the damage numbers above the player/entity

//function to draw tile based on x & y loci
function drawTile(tile, x, y) {
	image(tileset, x, y, TILE_SIZE, TILE_SIZE, tile*TILE_SRC_SIZE, 0, TILE_SRC_SIZE, TILE_SRC_SIZE);
} // Draws a tile at (x, y)

//function to draw item based on item type and x & y loci
function drawItems(item, x, y) {
	image(itemset, x, y, TILE_SIZE, TILE_SIZE, item*ITEM_SRC_SIZE, 0, ITEM_SRC_SIZE, ITEM_SRC_SIZE)
} // draws the item at the x & y


const VIEWPORT_WIDTH = 2 + CANVAS_WIDTH / TILE_SIZE; // How many tiles that fit in the screen plus 2 since so they don't white on the edges
const VIEWPORT_HEIGHT = 2 + CANVAS_HEIGHT / TILE_SIZE;

// draws the WORLD = TILE + ITEMS on designated x & y loci
function drawWorld(px, py) {
	for (let x = 0; x < VIEWPORT_WIDTH; x++) {
		for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
			let tile_x = Math.floor(x+px-VIEWPORT_WIDTH/2);
			if (tile_x < 0 || tile_x >= WORLD_WIDTH)	//check if tile is within widht
				continue
			let tile_y = Math.floor(y+py-VIEWPORT_HEIGHT/2);	//check if tile is within height
			if (tile_y < 0 || tile_y >= WORLD_HEIGHT)
				continue
			// draw tile from tile_y, tile_x at the screenspace converted position relative to player
			drawTile(tiles[tile_y][tile_x], (x-fract(px)-1)*TILE_SIZE, (y-fract(py)-1)*TILE_SIZE);

			const item = items[tile_y][tile_x];
			//check if there is an item in the tile
			// if yes then draw item on location
			if (item !== null) {
				drawItems(item, (x - fract(px) - 1) * TILE_SIZE, (y - fract(py) - 1) * TILE_SIZE);
			}
		}
	}
	drawTileStatus()

	// iterate through entities
	for (let i = 0; i < entities.length; i++)
		entities[i].draw();

	// iterate through current damageMarker array
	for (let i = 0; i < damageMarkers.length; i++)
		if (millis()-damageMarkers[i].time > 1000)
			damageMarkers.splice(i--, 1);
		else
			drawDamageMarker(damageMarkers[i]);


	fill(0, 0, 0, 0);
	// Shows the range of the current attack with weapon
	if (keyIsDown(SHIFT) ? inRangeSpecial(player.quickslot[player.selected], attack_x, attack_y) : inRange(player.quickslot[player.selected], attack_x, attack_y)) {
		stroke(100, 100, 255);
	} else {
		stroke(255, 100, 100);
	}

	// attack marker
	strokeWeight(8);
	if (player.quickslot[player.selected])
		if (!itemStats[player.quickslot[player.selected]].directional)
			rect((attack_x-fract(px)+VIEWPORT_WIDTH/2-1)*TILE_SIZE, (attack_y-fract(py)+VIEWPORT_HEIGHT/2-1)*TILE_SIZE, TILE_SIZE, TILE_SIZE)
	
	drawHealthbar()
	drawQuickslot()
	textAlign(LEFT);
	drawInvent()
	drawShop()
	drawRestart()

	// turn count on the screen
	textSize(32);
	fill(255);
	stroke(0);
	text(turnCount, 48, 32);
	text(level, 10, 32);

	textSize(20)
	text(`coins: ${player.coins}`, CANVAS_WIDTH - 120, 20);
	let h = 1;
	stroke(0);
	for (let i = 0; i < player.effects.length; i++) {
		if (player.effects[i] > 0) {
			// fill(255, 0, 0, 50*(1/statusTime[i]))
			// rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			// textSize(32);
			// fill(100)
			// textAlign(CENTER);
			// textFont('Courier New');
			//text(`Effect: ${convertStatus(i)}      Time left: ${player.effects[i]}`, CANVAS_WIDTH/2 ,h*32);
			image(statusiconset, (h-1)*32 + 10, CANVAS_HEIGHT*(4/5) + 15, TILE_SIZE, TILE_SIZE, i*32, 0, 32, 32);
			text(player.effects[i], (h-1)*32 + 20, CANVAS_HEIGHT*(4/5) + 35)
			h++;
			
		}
	}
	noStroke()
} // draws the entire map


export { CANVAS_WIDTH, CANVAS_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TILE_SIZE, itemset, tileset, entitysheet, drawWorld, damageMarkers, statusiconset, fillMinimap, EnemyMinimap};

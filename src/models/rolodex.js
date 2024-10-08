// rolodex.js

// requires npm install three
import { PlaneGeometry, BoxGeometry, MeshPhongMaterial, Mesh } from 'three';
import { CylinderGeometry, Group, DoubleSide, Color, Box3  } from 'three';

// import array from local file
import { flatColorChips } from './color_chips.js';

var cardWidth = 1.0;

var { colorChips, cardHeight, minX, maxX, minY, maxY, chipSize, chipMargin, min_value_row, max_value_row, min_chroma_column, max_chroma_column } = scaleColorChips(flatColorChips, cardWidth);
console.log(`cardHeight:${cardHeight}`);
console.log(`minX:${minX} maxX:${maxX}`);
console.log(`minX:${minY} maxX:${maxY}`);
console.log(`chipSize:${chipSize} chipMargin:${chipMargin}`);
console.log(`value_row:${min_value_row} .. ${max_value_row}`);
console.log(`chroma_column:${min_chroma_column} .. ${max_chroma_column}`);

function scaleColorChips(colorChips, cardWidth) {

    console.log(`incoming numColorChips:${colorChips.length}`);

    // Convert strings to floating point numbers
    colorChips.forEach(chip => {
        chip.x1 = parseFloat(chip.x1);
        chip.x2 = parseFloat(chip.x2);
        chip.y1 = parseFloat(chip.y1);
        chip.y2 = parseFloat(chip.y2);
        chip.value_row = parseInt(chip.value_row);
        chip.chroma_column = parseInt(chip.chroma_column);
        chip.page_hue_number = parseInt(chip.page_hue_number);
    });

    console.log(`before valueRow filtering numColorChips:${colorChips.length}`);

    // keep only colorChips with value_row between 1 and 9
    var colorChips = colorChips.filter(chip => {
        return chip.value_row >= 1 && chip.value_row <= 9;
    });

    console.log(`after valueRow filtering numColorChips:${colorChips.length}`);

    // Find ranges
    let xValues = colorChips.map(chip => chip.x1).concat(colorChips.map(chip => chip.x2));
    let yValues = colorChips.map(chip => chip.y1).concat(colorChips.map(chip => chip.y2));
    let valueRows = colorChips.map(chip => chip.value_row);
    let chromaColumns = colorChips.map(chip => chip.chroma_column);

    let minX = Math.min(...xValues);
    let maxX = Math.max(...xValues);
    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);
    let max_value_row = Math.max(...valueRows);
    let max_chroma_column = Math.max(...chromaColumns);

    // Calculate chip size and chip margin
    let chipSize = 75;
    let chipMargin = 5;

    // Scale chip dimensions to fit card width
    let scaleFactor = cardWidth / (maxX - minX + chipSize + chipMargin);
    chipSize *= scaleFactor;
    chipMargin *= scaleFactor;

    // Adjust card height to match aspect ratio of x-range and y-range
    let cardHeight = cardWidth * (maxY - minY) / (maxX - minX) - chipSize/2;

    // Translate and orient the color chips
    colorChips.forEach(chip => {
        var x_scale = -1;
        chip.x1 = cardWidth/2 - (chip.x1 * scaleFactor) + x_scale*chipSize;
        chip.x2 = cardWidth/2 - (chip.x2 * scaleFactor) + x_scale*chipSize;
        chip.y1 = (chip.y1 - minY) * scaleFactor - cardHeight/2; // flip y-axis to make minY at the top
        chip.y2 = (chip.y2 - minY) * scaleFactor - cardHeight/2; // flip y-axis to make minY at the top
    });

    return { colorChips, cardHeight, minX, maxX, minY, maxY, chipSize, chipMargin };
}

function createChip(colorChip, chipSize) {
    let chipDepth = (cardWidth/2 - colorChip.x1) * 0.16;
    var chipGeometry = new BoxGeometry(chipSize, chipSize, chipDepth);
    var chipMaterial = new MeshPhongMaterial(
        { color: new Color(parseInt(colorChip.r)/255.0, parseInt(colorChip.g)/255.0, parseInt(colorChip.b)/255.0) });
    var chip = new Mesh(chipGeometry, chipMaterial);
    chip.position.set(colorChip.x1 + chipSize / 2, colorChip.y1 + chipSize / 2, -chipDepth / 2);
    return chip;
}

var cylinderRadius = 0;

function createCard(angle, cylinderRadius, cardWidth, cardHeight) {
    // Create card
    var cardGeometry = new PlaneGeometry(cardWidth, cardHeight);
    var cardMaterial = new MeshPhongMaterial({
         //color: new Color(0xffffff), 
         side: DoubleSide,
         transparent: true, // Enable transparency
         opacity: 0.00 // Set opacity level (0 = fully transparent, 1 = fully opaque)
        });
    var card = new Mesh(cardGeometry, cardMaterial);
    card.position.x = Math.sin(angle) * (cylinderRadius + cardWidth / 2);
    card.position.z = Math.cos(angle) * (cylinderRadius + cardWidth / 2);
    card.rotation.y = angle + Math.PI / 2;

    return card;
}

function createCylinder(cardHeight, cylinderRadius) {
    // Create cylinder
    var cylinderGeometry = new CylinderGeometry(cylinderRadius, cylinderRadius, cardHeight, 32);
    var cylinderMaterial = new MeshPhongMaterial({ color: 0xaaaaaa });
    var cylinder = new Mesh(cylinderGeometry, cylinderMaterial);
    return cylinder;
}

var degreesToRadians = 2*Math.PI/360;
var radiansToDegrees = 1.0/degreesToRadians;

export function createRolodex() {
    // Create the Rolodex
    var rolodex = new Group();

    // Create the cards of the Rolodex
    var numCards = 40;
    for (var i = 0; i < numCards; i++) {
        // if (i % 4 !== 0)
        //     continue;
        var angle = (i / numCards) * Math.PI * 2;
        var card = createCard(angle, cylinderRadius, cardWidth, cardHeight);
        rolodex.add(card);

        let matchingColorChips = colorChips.filter(chip => chip.page_hue_number-1 === i);
        console.log(`card:${i} degrees:${Math.floor(angle*radiansToDegrees)} #matchingColoChips ${matchingColorChips.length}`)

        var fontSize= 0.02;

        matchingColorChips.forEach(colorChip => {
            var chip = createChip(colorChip, chipSize);
            card.add(chip);
        });
    }

    // var cylinder = createCylinder(cardHeight, cylinderRadius);
    // rolodex.add(cylinder);

    var boundingBox = new Box3();

    // Expand the bounding box to include each card
    rolodex.children.forEach(card => {
        boundingBox.expandByObject(card);
    });

    console.log('Bounding Box:', JSON.stringify(boundingBox,null,2));

    return [rolodex, boundingBox];
}


const getBoundary = (arr, prop) => arr.reduce((acc, obj) => ({
    min: Math.min(acc.min, obj[prop]),
    max: Math.max(acc.max, obj[prop])
}), { min: Infinity, max: -Infinity });
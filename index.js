// Colors are given in HSL, which is supported by css
//
// hsl(hue saturation value [opacity]) 
//
// Hue (color) is in degrees (0 to 360)
// Saturation is in percent
// Value are in percent
// Opacity goes from 0 to 1

// ----- Utility functions -----
const rand = Math.random
function randFloat(min, max) { return rand() * (max-min) + min }
function randAngle() { return randFloat(0, 360) }
function randPercent() { return randFloat(0, 100) }
function shuffle(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ----- Utility functions (color) -----
function okayColor(color) {
    if (color.l < 20) return false // Not too dark
    if (color.l > 95) return false // Not too light

    if (color.l < 90 && color.l > 30) return false // Pressure test
    return true
}

function _randomColor() { return { h: randAngle(), s: randPercent(), l: randPercent() } }
function randomColor() {
    // Random h, s, v from acceptable ranges only
    var color
    do { color = _randomColor() } while(!okayColor(color))
    return color
}

function _randomNearbyColor(baseColor, maxDistance) {
    var color
    do { color = _randomColor(baseColor, maxDistance) } while(colorDistance(baseColor, color) > maxDistance)
    return color
}
function randomNearbyColor(baseColor, maxDistance) {
    var color
    do { color = _randomNearbyColor(baseColor, maxDistance) } while(!okayColor(color))
    return color
}

function colorDistance(color1, color2) {
    return Colour.deltaE00(color1, color2)
}

function borderColor(color) {
    if (color.l < 40) { // Dark color, light border
        return {
            h: color.h,
            s: Math.min(100, color.s + 20),
            l: color.l * 1.1,
            a: Math.min((color.a||1) + .2, 1)
        }
    } else { // Light or medium color, dark border
        return {
            h: color.h,
            s: Math.max(0, color.s - 20),
            l: color.l * 0.99,
            a: Math.min((color.a||1) + .2, 1)
        }
    }
}

function cssColor(color) {
    return `hsla(${color.h}deg, ${color.s}%, ${color.l}%, ${color.a || 1})`
}

// ----- Level generation -----
const NUMBER = 48
const NUM_GROUPS = 4
const PIECE_SIZE = 50 // In pixels

function randomPlace() {
    const width = $(".game").width()
    const height = $(".game").height()

    const x = randFloat(0.1*width, 0.9*width - PIECE_SIZE)
    const y = randFloat(0.1*height, 0.9*height - PIECE_SIZE)
    return {x, y}
}

function randomPlaces(number) {
    var l = []
    for (var i=0; i<number; i++) l.push(randomPlace())
    return l
}

function randomBaseColors(n, minDistance) {
    var colors = []
    for (var i=0; i<n; i++) {
        var failed = true
        while (failed) {
            colors[i] = randomColor()
            failed = false
            for (var j=0; j<i; j++) {
                if (colorDistance(colors[j], colors[i]) < minDistance) failed = true
            }
        }
    }
    return colors
}

function difficultyToColorDistance(difficulty) {
    return Math.pow(2, 1/difficulty) * 10
}
function randomColors(difficulty, number) {
    var l = []
    const colorDistance = difficultyToColorDistance(difficulty)
    const baseColors = randomBaseColors(NUM_GROUPS, colorDistance)
    console.log(baseColors)
    // Generate
    for (var g=0; g<NUM_GROUPS; g++) {
        for (var i=0; i<number/NUM_GROUPS; i++) {
            l.push({
                color: randomNearbyColor(baseColors[g], colorDistance/3),
                group: g
            })
        }
    }
    shuffle(l)
    return l
}

function generatePiece(data, place) {
    const piece = $('<div class="bit"></div>')
    piece.data("color", data.color)
    piece.css("background-color", cssColor(data.color))
    piece.css("border-color", cssColor(borderColor(data.color)))
    piece.data("group", data.group)
    $(".bits").append(piece)
    movePiece(piece, place)
    piece.on("mousedown", startDrag)
    return piece
}

function generateLevel(difficulty, number) {
    if (number % NUM_GROUPS != 0) number += NUM_GROUPS-(number % NUM_GROUPS)
    console.log(difficulty, number)

    const colors = randomColors(difficulty, number)
    const places = randomPlaces(number)

    for (var i=0; i<number; i++) generatePiece(colors[i], places[i])
}

// ----- Drag and drop -----
function movePiece(piece, place) {
    const width = $(".game").width()
    const height = $(".game").height()
    if (place.x > width - PIECE_SIZE) place.x = width - PIECE_SIZE
    if (place.x < 0) place.x = 0
    if (place.y > height - PIECE_SIZE) place.y = height - PIECE_SIZE
    if (place.y < 0) place.y = 0

    // By setting left and top as percents, we deal with window resize for free, and also make it easy to check the quadrant something is in.
    piece.css("left", `${place.x / width * 100}%`).css("top", `${place.y / height * 100}%`)
}

function startDrag(e) {
    console.log("mousedown(startDrag)", e)
    if (e.button > 0) return;

    const piece = $(e.target)
    piece.addClass("dragged")

    const offset = { x: e.offsetX, y: e.offsetY }
    e.preventDefault()

    function dragLocation(e) {
        return {
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
        }
    }

    $(window).on("mousemove", (e) => {
        place = dragLocation(e)
        // Show drag
        console.log("mousemove", e, place)
        movePiece(piece, place)
    })

    $(window).on("mouseup", (e) => {
        console.log("mouseup", e)

        piece.removeClass("dragged")
        $(window).off("mouseup")
        $(window).off("mousemove")

        // End drag
        movePiece(piece, place)
    })

}

// -----  UI  -----
var everStarted = false
function startGame() {
    $(".between-games").hide()
    $(".in-game").show()

    if (!everStarted) {
        everStarted = true
        firstStart()
    }

    const difficulty = Number($("#difficulty").val())
    generateLevel(difficulty, NUMBER)
}

function gameOver() {
    $(".between-games").hide()
    $(".in-game").show()
}

function donePressed() {

}

$(document).ready(() => {
    $(".in-game").hide()
    $(".button.done").on("click", donePressed)
    $(".button.start").on("click", startGame)
})

function firstStart() {
    const aud = document.getElementById("audio")
    aud.volume = 0.2
    aud.play()
}


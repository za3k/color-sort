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
function emptyArray(n, e) {
    var a = []
    for (var i=0; i<n; i++) a.push(e)
    return a
}
function invertDict(d) {
    var d2 = {}
    for (var k in d) d2[d[k]] = k
    return d2
}
function sortKeysByValue(d) {
    ks = Object.keys(d)
    ks.sort((a, b) => { return d[b] - d[a] })
    console.log(d, ks)
    return ks
}


// ----- Utility functions (color) -----
function okayColor(color) {
    if (color.l < 20) return false // Not too dark
    if (color.l > 95) return false // Not too light
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
const NUM_GROUPS = 4
const PIECE_SIZE = 50 // In pixels

function randomPlace() {
    const width = $(".game").width()
    const height = $(".game").height()

    const x = randFloat(0.01*width, 0.99*width - PIECE_SIZE)
    const y = randFloat(0.01*height, 0.99*height - PIECE_SIZE)
    return {x, y}
}

function randomPlaces(number) {
    var l = []
    for (var i=0; i<number; i++) l.push(randomPlace())
    return l
}

function randomBaseColors(n, minDistance, maxDistance) {
    var colors = []
    for (var i=0; i<n; i++) {
        var failed = true
        while (failed) {
            colors[i] = randomColor()
            failed = false
            for (var j=0; j<i; j++) {
                if (colorDistance(colors[j], colors[i]) < minDistance) failed = true
                if (colorDistance(colors[j], colors[i]) > maxDistance) failed = true
            }
        }
    }
    return colors
}

function difficultyToColorDistance(difficulty) {
    // First two numbers are how different the groups are (3-30)
    // Second number is how much variation within a group
    return [30, 1000, 9]
}
function randomColors(difficulty, number) {
    var l = []
    const [bigMin, bigMax, small] = difficultyToColorDistance(difficulty)
    const baseColors = randomBaseColors(NUM_GROUPS, bigMin, bigMax)
    // Generate
    for (var g=0; g<NUM_GROUPS; g++) {
        for (var i=0; i<number/NUM_GROUPS; i++) {
            l.push({
                color: randomNearbyColor(baseColors[g], small),
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
    piece.on("mousedown touchstart", startDrag)
    return piece
}

function generateLevel(difficulty, number) {
    if (number % NUM_GROUPS != 0) number += NUM_GROUPS-(number % NUM_GROUPS)

    const colors = randomColors(difficulty, number)
    const places = randomPlaces(number)

    for (var i=0; i<number; i++) generatePiece(colors[i], places[i])
}

// ----- Win logic -----
// piece.quadrant, piece.group
function bestQuadsForGroup(g, pieces) {
    const quadScore = {0:0, 1:0, 2:0, 3:0}
    for (var piece of pieces) {
        if (piece.quadrant < 0) continue
        if (piece.group == g) {
            quadScore[piece.quadrant] += 1
        } else {
            quadScore[piece.quadrant] -= 0.5
        }
    }
    return sortKeysByValue(quadScore)
}
function assignQuadrants(pieces) {
    const quadClaimed = [false, false, false, false]
    const ret = {}
    for (var g=0; g < 4; g++) {
        const bq = bestQuadsForGroup(g, pieces)
        console.log({g, bq, quadClaimed, ret, pieces})
        for (var q of bestQuadsForGroup(g, pieces)) {
            if (!quadClaimed[q]) {
                quadClaimed[q] = true
                ret[q] = g
                break
            }
        }
    }
    return ret
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
    //console.log("mousedown(startDrag)", e)
    if (e.button > 0) return;

    const piece = $(e.target)
    piece.addClass("dragged")

    var offset, ongoingTouches
    if (e.touches) {
        offset = { x: e.touches[0].pageX - piece.offset().left + 3, y: e.touches[0].pageY - piece.offset().top + 3 } // 3 is the border width
        ongoingTouches = e.touches
    } else
        offset = { x: e.offsetX + 3, y: e.offsetY + 3 } // 3 is the border width
    e.preventDefault()

    function dragLocation(e) {
        if (e.type == "touchend") e = ongoingTouches[0]
        else if (e.touches) e = e.touches[0]
        return {
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
        }
    }

    $(window).on("mousemove touchmove", (e) => {
        place = dragLocation(e)
        // Show drag
        movePiece(piece, place)
        ongoingTouches = e.touches
    })

    $(window).on("mouseup touchend touchcancel", (e) => {
        place = dragLocation(e)

        piece.removeClass("dragged")
        $(window).off("mouseup mousemove touchmove touchend")

        // End drag
        movePiece(piece, place)
    })

}

// -----  UI  -----
const ANIMATION_TIME = 2000 // Time to show pieces moving, in ms

var everStarted = false
function startGame() {
    $(".between-games").hide()
    $(".in-game").show()
    $(".bit").remove()

    if (!everStarted) {
        everStarted = true
        firstStart()
    }

    const difficulty = Number($("#difficulty").val())
    const number = getNumber()
    generateLevel(difficulty, number)
}

function gameOver() {
    $(".between-games").show()
    $(".in-game").hide()
}

function animateMove(piece, quad, durationMs) {
    const target = {
        x: quad.position().left + randFloat(0, quad.width()-PIECE_SIZE),
        y: quad.position().top + randFloat(0, quad.height()-PIECE_SIZE)
    }

    piece.animate({
        top: target.y,
        left: target.x
    }, durationMs)
}

function donePressed() {
    const pieces = []
    const quadrants = [$(".quadrant.top.left"), $(".quadrant.top.right"), $(".quadrant.bottom.left"), $(".quadrant.bottom.right")]
    const width = $(".game").width()
    const height = $(".game").height()

    for (var piece of $(".bit")) {
        // Note its quadrant
        piece = $(piece)
        const place = piece.position()
        var quadrant = 0 + (place.left > width/2) + 2*(place.top > height/2)
        // Pieces in the + empty space
        if ((0.4*width < place.left && place.left < 0.6*width-PIECE_SIZE) ||
            (0.4*height < place.top && place.top < 0.6*height-PIECE_SIZE)) quadrant = -1;

        piece.data("quadrant", quadrant)
        pieces.push({
            quadrant: piece.data("quadrant"),
            group: piece.data("group"),
            e: piece
        })
    }
    const quad2group = assignQuadrants(pieces)
    quad2group[-1] = -1
    const group2quad = invertDict(quad2group)

    for (piece of pieces) {
        if (piece.group != quad2group[piece.quadrant]) {
            animateMove(piece.e, quadrants[group2quad[piece.group]], ANIMATION_TIME)
        }
    }

    setTimeout(gameOver, ANIMATION_TIME)
}

function getNumber() {
    const value = $("#number")[0].value
    const number = $(".number-section datalist").find(`option[value=${value}]`).data("number")
    return Number(number)
}

function updateNumber() { $("label[for=number]").text(getNumber()) }
$(document).ready(() => {
    $(".in-game:not(.title)").hide()
    $(".button.done").on("click", donePressed)
    $(".button.start").on("click", startGame)
    $("#number").on("input", updateNumber)
})

function firstStart() {
    const aud = document.getElementById("audio")
    aud.volume = 0.2
    aud.play()
    $(".pulse").removeClass("pulse")
}


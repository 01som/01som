var self

var Circle = function(params, app) {

    this.params = params !== undefined ? params : {}
    this.app = app

    this.n                     = params.n || 8
    this.options               = params.options || []
    this.shake                 = params.shake || false
    this.sequencer             = params.sequencer || false
    this.binary                = params.binary !== undefined
    this.spatial               = params.spatial || false
    this.pointRadius           = params.pointRadius || app.pointRadius || 18
    this.pointFillColor        = params.pointFillColor || COLORS.white
    this.pointStroke           = params.pointStroke || COLORS.grey
    this.pointStrokeWidth      = params.pointStrokeWidth || 1
    this.pointStrokeWidthHover = params.pointStrokeWidthHover || 2
    this.dotRadius             = params.dotRadius || 2
    this.circleBackgroundColor = params.circleBackgroundColor || COLORS.lightblue
    this.sequencerRectSize     = params.sequencerRectSize || 40
    this.xFunc                 = params.xFunc || function() { return window.innerWidth/2 }
    this.yFunc                 = params.yFunc || function() { return window.innerHeight/2 }
    // this.rFunc                 = params.rFunc || function() { return Math.min(4/5/2*app.height, 3/7/2 * app.width) }


    this.rFunc = params.rFunc || Circle.defaults.rFunc

    if (this.binary) {
        this.binaryContainer = document.getElementById(params.binary)
        if (this.binaryContainer === null) throw new ReferenceError("Invalid div for binary")
    }

    // NOTE: the idea is that this.r is always the same and is never changed.
    // is it's used together with the return of rFunc() to calcualte the necessary transformation to apply
    // see .resize() for its use.
    this.r = this.rFunc()
    this.x = this.xFunc()
    this.y = this.yFunc()

    this.svg = paper.svg({ x: this.x, y: this.y })
    this.svg.attr({overflow: "visible"}) // NOTE: because otherwise will just show the only positive quadrant

    this.dots = []
    this.points = []
    this.elem = null
    this.groups = []

    this.init()

}

Circle.prototype.init = function() {

    this.initSequencer = function() {

        this.initParams = function() {
            this.sequencer = {}
            this.sequencer.active = this.params.sequencer.active || 0
            this.sequencer.labelsArray = this.params.sequencer.labels || ["1", "2", "3"]
            this.sequencer.n = this.sequencer.labelsArray.length
        }

        this.initSequencerPoints = function() {
            this.sequencer.points = []
            this.groups.points = this.svg.group()
            this.groups.points.addClass("point")
            this.groups.points.addClass("noSelect")
            for (var i = 0; i < this.sequencer.n; i++) {
                this.sequencer.points[i] = []
                for (var j = 0; j < this.n; j++) {
                    var p = new Point(j, this)
                    p.show(i === this.sequencer.active)
                    this.sequencer.points[i].push(p)
                    this.groups.points.add(p.group)
                }
            }
            this.points = this.sequencer.points[this.sequencer.active]
        }

        this.initText = function() {

            this.sequencer.labels = []
            this.groups.sequencer = this.svg.group()
            this.groups.sequencer.addClass("sequencer")

            for (var j = 0; j < this.sequencer.n; j++) {

                var labelText = this.sequencer.labelsArray[j]
                var step = (2*this.r) / (this.sequencer.n+1)
                var x0 = -this.r + step
                var x = x0 + step*j

                var text = this.svg.text()
                text.attr({
                    text: labelText,
                    fill: COLORS.grey,
                    id: "text-sequence-" + j,
                    "text-anchor": "middle",
                    "alignment-baseline": "central"
                })

                var rect = this.svg.rect()
                var stroke = j === this.sequencer.active ? COLORS.grey : this.circleBackgroundColor
                rect.attr({
                    fill: this.circleBackgroundColor,
                    stroke: stroke,
                    strokeWidth: 1,
                    id: "rect-sequence-" + j
                })

                var group = this.svg.group(rect, text)
                group.addClass("label")

                group.click(function(e) {
                    var prevLabelIdx = self.sequencer.active
                    var currLabelIdx = Number(e.target.id.split("-")[2]) // TODO: this is an hack, refactor later!
                    if (prevLabelIdx == currLabelIdx) return
                    self.sequencer.active = currLabelIdx
                    self.sequencer.labels[prevLabelIdx].rect.attr({stroke: this.circleBackgroundColor})
                    self.sequencer.labels[currLabelIdx].rect.attr({stroke: COLORS.grey})
                    self.points = self.sequencer.points[currLabelIdx]
                    for (var i = 0; i < self.sequencer.points.length; i++) {
                        self.sequencer.points[i].forEach(function(p) {
                            p.show(i === currLabelIdx)
                        })
                    }
                    if (self.binary) {
                        self.binary = self.sequencer.binary[self.sequencer.active]
                        self.updateBinary()
                    }
                })

                this.sequencer.labels.push({
                    text: text,
                    rect: rect,
                    group: group
                })

                this.alignSequencer()

                this.groups.sequencer.add(group)
            }

        }

        this.initParams()
        this.initSequencerPoints()
        this.initText()

    }

    this.initPoints = function() {
        this.groups.points = this.svg.group()
        this.groups.points.addClass("point")
        for (var i = 0; i < this.n; i++) {
            this.points[i] = new Point(i, this)
            this.groups.points.add(this.points[i].group)
        }
    }

    this.initBinary = function() {

        if (this.sequencer) {
            this.sequencer.binary = new Array(this.sequencer.n)
            for (var n = 0; n < this.sequencer.n; n++) {
                this.sequencer.binary[n] = Utils.zeros(this.options.length, this.points.length)
            }
            this.binary = this.sequencer.binary[this.sequencer.active]
        }
        else {
            this.binary = Utils.zeros(this.options.length, this.points.length)
        }

        this.updateBinary()

    }

    this.initShake = function() {

        var shake = new Shake({
            threshold: 15, timeout: 1000
        }).start()

        var self = this

        var shaked = function() {
            if (self.app.playing) $("#btnPlay").trigger("click")
            if (!self.sequencer) self.points.forEach(function(point) { point.reset() })
            else {
                self.sequencer.points.forEach(function(points) {
                    points.forEach(function(point) {
                        point.reset()
                    })
                })
            }

        }

        window.addEventListener('shake', shaked, false)
    }

    this.initCircle = function() {
        this.elem = this.svg.circle(0, 0, this.r)
        this.elem.attr({
            fill: this.circleBackgroundColor,
            stroke: COLORS.grey,
            strokeWidth: 3
        })
    }

    this.initDots = function() {
        this.groups.dots = this.svg.group()
        this.groups.dots.addClass("dots")
        for (var i = 0; i < this.n; i++) {
            var angle = (i / (this.n)) * 2 * Math.PI
            var x =  Math.sin(angle) * (this.r + this.pointRadius) * 1.1
            var y = -Math.cos(angle) * (this.r + this.pointRadius) * 1.1
            var dot = this.svg.circle(x, y, this.dotRadius).attr({
                visibility: "hidden"
            })
            this.dots.push(dot)
            this.groups.dots.add(dot)
        }
    }

    this.initDebug = function() {
        this.grid = {}
        var lines = ["vline", "hline"]
        lines.forEach(function(line) {
            self.grid[line] = self.svg.line().attr({stroke: "rgba(0,0,0,0.3)"})
        })
        this.resize()
    }

    var self = this

    this.initCircle()
    this.initDots()
    if (this.sequencer) this.initSequencer(); else this.initPoints()
    if (this.binary) this.initBinary()
    if (this.shake) this.initShake()
    if (this.spatial) this.initSpatial()
    if (this.app.debug) this.initDebug()

}

Circle.prototype.resize = function() {

    this.x = this.xFunc()
    this.y = this.yFunc()

    var ratio = this.rFunc()/this.r
    var transform = new Snap.Matrix().scale(ratio)

    var padding = 10
    var r = app.height - 3*padding/2/2
    var y1 = padding + r
    var y2 = app.height - padding - r

    // Update nested svgs positions
    if (this.elem) {
        this.svg.attr({x: this.x, y: this.y})
        this.elem.transform(transform)
    }

    // Scale points so that they are easily clickable in mobile
    if (!this.sequencer && this.points) this.points.forEach(function(point) {
        point.group.transform(transform) // this make sures the points are in place if radius change
        point.elem.attr({r: point.r*1/ratio})
    })

    // Do the same for sequenecer points
    if (this.sequencer) {
        this.sequencer.points.forEach(function(sequencerPoints) {
            sequencerPoints.forEach(function(point) {
                point.group.transform(transform)
                point.elem.attr({r: point.r*1/ratio})
            })
        })
    }

    // Align dots too
    if (this.dots) { this.dots.forEach(function(dot) { dot.transform(transform) }) }

    // And the sequencer
    if (this.sequencer) this.alignSequencer()

    if (this.app.debug && this.grid) {

        var self = this

        this.grid.vline.attr({
            x1: 0,
            x2: 0,
            y1: -self.svg.getBBox().h/2,
            y2:  self.svg.getBBox().h/2,
        })

        this.grid.hline.attr({
            x1: -self.svg.getBBox().w/2,
            x2:  self.svg.getBBox().w/2,
            y1: 0,
            y2: 0,
        })
    }

}

Circle.prototype.schedule = function() {

    var self = this

    // TODO: Improve readability
    for (var i = 0; i < this.n; i++) {
        (function() {
            var _i = i
            Tone.Transport.schedule(function(t) {

                var ts = performance.now()

                var p = self.points[_i]
                var previousI = (_i == 0) ? self.n - 1 : _i - 1
                var previousP = self.points[previousI]

                // NOTE: animate when active
                p.elem.animate({
                    r: self.pointRadius * 1.25},
                    150,
                    function(){},
                    p.elem.animate({
                        r: self.pointRadius
                    }, 1000)
                )

                if (self.panner) self.app.panner.setPosition(-p.x, 0, p.y)

                Utils.hide(self.dots[previousI])
                Utils.show(self.dots[_i])

                if (p.state != -1) {
                    var sample = self.options[p.state].sample
                    self.app.audios[sample].start(t)
                }

            }, i + "*8n")
        })()
    }
}

Circle.prototype.stop = function() {
    this.dots.forEach(function(dot) {
        Utils.hide(dot)
    })
}

Circle.prototype.updateBinary = function() {

    var self = this

    var i, j

    // First clear matrix
    for (i = 0; i < this.binary.length; i++)
        for (j = 0; j < this.binary[i].length; j++)
            this.binary[i][j] = 0

    // And then repopulate
    this.points.forEach(function(point, index) {
        if (point.state == -1) return
        var j = index
        var i = point.state
        self.binary[i][j] = 1
    })

    // Draw matrix
    if (this.binary) {
        this.binaryContainer.innerHTML = ""
        for (i = 0; i < this.binary.length; i++) {
            for (j = 0; j < this.binary[i].length; j++) {
                this.binaryContainer.innerHTML += this.binary[i][j]
            }
            this.binaryContainer.innerHTML += "<br>"
        }
    }

}

Circle.prototype.setPosition = function(pos) {
    this.x = pos.x
    this.y = pos.y
    this.elem.attr({cx: this.x, cy: this.y })
}

// NOTE: this serves to redistribute the labels according to the new size of the
// radius of the circle, while maintaining the same size for the labels and text
Circle.prototype.alignSequencer = function() {

    var self = this

    this.sequencer.labels.forEach(function(label, index) {
        var step = (2*self.rFunc()) / (self.sequencer.n+1)

        var x0 = -self.rFunc() + step
        var x = x0 + step*index
        label.text.attr({x: x})
        var size = self.sequencerRectSize
        label.rect.attr({x: x-size/2, y: -size/2, width: size, height: size})
    })
}

Circle.defaults = {}

Circle.defaults.options = {
    percussive: [{
        color: COLORS.blue,
        sample: "kick"
    }, {
        color: COLORS.green,
        sample: "clap"
    }, {
        color: COLORS.red,
        sample: "snap"
    }],
    notes: [{
        color: COLORS.do1,
        sample: "do1",
        text: "DÓ"
    }, {
        color: COLORS.re,
        sample: "re",
        text: "RÉ"
    }, {
        color: COLORS.mi,
        sample: "mi",
        text: "MI"
    }, {
        color: COLORS.sol,
        sample: "sol",
        text: "SOL"
    }, {
        color: COLORS.la,
        sample: "la",
        text: "LÁ"
    }, {
        color: COLORS.do2,
        sample: "do2",
        text: "dó"
    }]
}

// NOTE: do "perfect alignment",
// instead of leaving double space in the middle of circles
// leave the same as in the margins
Circle.defaults.rFunc = function() {
    var bigSide   = Math.max(app.height, app.width)
    var smallSide = Math.min(app.height, app.width)
    var r = (bigSide/2 - app.padding - app.padding/2 - app.pointRadius*2)/2
    var l = r*2 + 2*app.pointRadius + 2*app.padding
    if (l > smallSide) r = (smallSide - 2*app.padding - 2*app.pointRadius)/2
    return r
}

Circle.defaults.xyFuncAux = function(offset) {
    offset = offset || 0
    var bigSide = Math.max(app.width, app.height)
    var util = (bigSide/2 - app.padding - app.padding/2 - app.pointRadius*2)
    var ret = offset + app.padding + app.pointRadius + util/2
    return ret
}

Circle.defaults.xFunc1 = function() {
    if (Utils.isLandscape()) return Circle.defaults.xyFuncAux()
    else return app.width/2
}

Circle.defaults.yFunc1 = function() {
    if (Utils.isPortrait()) return Circle.defaults.xyFuncAux()
    else return app.height/2
}

Circle.defaults.xFunc2 = function() {
    if (Utils.isLandscape()) return Circle.defaults.xyFuncAux(app.width/2-app.padding/2)
    else return app.width/2
}

Circle.defaults.yFunc2 = function() {
    if (Utils.isPortrait()) return Circle.defaults.xyFuncAux(app.height/2-app.padding/2)
    else return app.height/2
}

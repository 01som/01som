var app

$(function() {

    app = new App({
        paths: App.defaults.paths.all(),
        spatial: false,
    })

    app.addCircle({
        xFunc: function() { if (Utils.isLandscape()) return app.width/4; else return app.width/2 },
        yFunc: function() { if (Utils.isLandscape()) return app.height/2; else return app.height/4 },
        rFunc: function() { return app.width/3*0.70 }, // NOTE: 0.84 is fine-tuned so that ellipses don't overlap
        options: Circle.defaults.options.percussive,
        shake: true,
        binary: "binary-placeholder-1"
    })

    app.addCircle({
        xFunc: function() { if (Utils.isLandscape()) return 3*(app.width/4); else return app.width/2 },
        yFunc: function() { if (Utils.isLandscape()) return app.height/2; else return 3*(app.height/4) },
        rFunc: function() { return app.width/3*0.70 },
        options: Circle.defaults.options.notes,
        shake: true,
        binary: "binary-placeholder-2"
    })

})

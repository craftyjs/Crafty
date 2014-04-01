(function() {
  module("Audio");

  //Set up some test fixtures
  function MockAudio() {
    var self = this;
    this.endedListeners = [];
    this.canPlayType = function() {
      return true;
    };
    this.addEventListener = function(event, listener) {
      switch (event) {
        case "ended":
          this.endedListeners.push(listener);
          break;
        default:
          throw new Exception("Not implemented");
      }
    };
    this.removeEventListener = function(event, listener) {
      switch (event) {
        case "ended":
          var ind = this.endedListeners.indexOf(listener);
          if (ind) this.endedListeners.splice(ind, 1);
          break;
        default:
          throw new Exception("Not implemented");
      }
    };

    function fireEnded() {
      setTimeout(function() {
        self.ended = true;
        self.endedListeners.forEach(function(f) {
          f.call(self);
        });
      }, 0);
    }
    this.play = function() {
      if (this.src) {
        fireEnded();
      }
    };
    this.pause = function() {};
    this.ended = false;
  }

  function ChromeBuggedAudio() {
    var self = this;
    this.canPlayType = function() {
      return true;
    };
    this.addEventListener = function(event, listener) {};
    this.removeEventListener = function(event, listener) {};
    this.play = function() {
      if (this.src) {
        self.ended = true;
        self.src = null;
        ok(true, "Audio played");
      }
    };
    this.pause = function() {};
    this.ended = false;
  }


  asyncTest("setChannels", function() {
    // Test that setChannels doesn't break sound
    expect(2);
    window.Audio = MockAudio;
    Crafty.support.audio = true;
    Crafty.audio.setChannels(5);
    Crafty.audio.add("mockSound", ["sound.ogg"]);
    var a = Crafty.audio.play("mockSound", 1);
    ok(typeof a === "object", "Type of a is object: " + a);
    a.addEventListener("ended", function() {
      ok(true, "Sound played");
      delete window.Audio; //reset Audio to platform default
      Crafty.audio.channels = [];
      start();
    });
  });

  test("chromeBug", function() {
    // Test that we don't exhaust our audio channels if Chrome bug 280417
    // eats our "ended" events
    expect(10);
    window.Audio = ChromeBuggedAudio;
    Crafty.support.audio = true;
    Crafty.audio.setChannels(1);
    Crafty.support.audio = true;
    Crafty.audio.add("mockSound", ["sound.ogg"]);

    var a;
    for (var i = 0; i < 10; i++) {
      a = Crafty.audio.play("mockSound", 1); // This will trigger an assertion
    }
    delete window.Audio; //reset Audio to platform default
    Crafty.audio.channels = [];
  });
})();
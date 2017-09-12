const h = snabbdom.h;
patch = snabbdom.init([snabbdom_attributes.attributesModule]);

function componentOne(state) {

  state({
    player: {
      location: {x: 0, y: 0},
      destination: {x: 0, y: 0}
    },
    puppy: randomFieldLocation(),
    npcs: (() => {
      let a = [];
      while (Math.random() < 0.95) {
        let location = randomFieldLocation();
        location.destination = randomFieldLocation();
        a.push(location);
      }
      return a;
    })()
  });

  function randomFieldLocation() {
    return {
      x: Math.round(Math.random() * 100),
      y: Math.round(Math.random() * 100)
    }
  }

  const clicks = flyd.stream();
  const clickActions = flyd.map(evnt =>
    ({
      action: 'CHANGE_DEST',
      destination: {x: evnt.pageX, y: evnt.pageY}
    }),
    clicks
  );

  const keypresses = flyd.stream();
  const keypressActions = flyd.stream();
  flyd.on(evnt => {
    let action;
    switch (evnt.code) {
      case "KeyJ":
        action = {action: 'SOUTH'};
        break;
      case "KeyK":
        action = {action: 'NORTH'};
        break;
      case "KeyH":
        action = {action: 'WEST'};
        break;
      case "KeyL":
        action = {action: 'EAST'};
        break;
      default:
        action = undefined;
    }
    if (action !== undefined) {
      keypressActions(action);
    }
  }, keypresses)  

  const updateActions = flyd.stream();
  
  const actions = flyd.merge(updateActions,
                             flyd.merge(clickActions,
                                        keypressActions));

  function updateState(oldState, action) {
    let newState;
    switch (action.action) {
      case 'CHANGE_DEST':
        newState = {
          player: {
            destination: action.destination,
            location: oldState.player.location
          },
          puppy: oldState.puppy
        };
        break;
      case 'SOUTH':
        newState = {
          player: {
            destination: {
              x: oldState.player.destination.x,
              y: oldState.player.destination.y + 1
            },
            location: oldState.player.location
          },
          puppy: oldState.puppy
        };
        break;
      case 'NORTH':
        newState = {
          player: {
            destination: {
              x: oldState.player.destination.x,
              y: oldState.player.destination.y - 1
            },
            location: oldState.player.location
          },
          puppy: oldState.puppy
        };
        break;
      case 'WEST':
        newState = {
          player: {
            destination: {
              x: oldState.player.destination.x - 1,
              y: oldState.player.destination.y
            },
            location: oldState.player.location
          },
          puppy: oldState.puppy
        };
        break;
      case 'EAST':
        newState = {
          player: {
            destination: {
              x: oldState.player.destination.x + 1,
              y: oldState.player.destination.y
            },
            location: oldState.player.location
          },
          puppy: oldState.puppy
        };
        break;
      case 'UPDATE':
        newState = {
          player: {
            destination: oldState.player.destination,
            location: moveToward(oldState.player.location, oldState.player.destination)
          },
          puppy: oldState.puppy
        };
        break;
      default:
        newState = oldState;
    }
    newState.npcs = oldState.npcs;
    if (Math.abs(newState.player.location.x - newState.puppy.x) < 5 &&
        Math.abs(newState.player.location.y - newState.puppy.y) < 5 ) {
      newState.win = true;
    }
    return newState;
  }

  function moveToward(loc, dest) {
    let xDirection = dest.x - loc.x;
    let yDirection = dest.y - loc.y;
    return {
      x: xDirection === 0 ? loc.x : (xDirection > 0 ? loc.x + 1 : loc.x - 1),
      y: yDirection === 0 ? loc.y : (yDirection > 0 ? loc.y + 1 : loc.y - 1)
    }
  }

  flyd.on(action => state(updateState(state(), action)), actions);

  const vdom = flyd.map(newState => createVDom(newState), state);

  function createVDom(localState) {
    return h('div.field', [
      localState.win ? h('h1', 'You won!!!') :
        h('svg', {attrs: {width: '100%', height: '100%'}}, [
         createSVGWithClass(localState.player.location, 'player'),
         createSVGWithClass(localState.puppy, 'puppy'),
       ].concat(localState.npcs.map(npc => createSVGWithClass(npc, 'npc'))))
    ]);
  }
  
  function createSVGWithClass(location, className) {
    return h('circle', {attrs: {
      class: className,
      cx: location.x,
      cy: location.y
    }})
  }
  
  const setup = () => {
    document.body.addEventListener('keypress', keypresses);
    document.body.addEventListener('click', clicks);
    setInterval(() => updateActions({action: 'UPDATE'}), 20);
  };
  
  return {DOM: vdom, setup: setup};
}

document.addEventListener('DOMContentLoaded', function() {
  const state = flyd.stream({entry: flyd.stream()});
  const entry = componentOne(state().entry);
  const vdoms = flyd.scan((acc, newVDOM) => [acc[1], newVDOM],
                          [null, document.getElementById('app')],
                          entry.DOM);
  flyd.on(([oldV, newV]) => patch(oldV, newV), vdoms);
  entry.setup();
});
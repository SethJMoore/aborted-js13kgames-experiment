const h = snabbdom.h;
patch = snabbdom.init([snabbdom_attributes.attributesModule]);

function componentOne(state) {

  state({
    player: {x: 0, y: 0},
    puppy: {x: 50, y: 50},
    npcs: (() => {
      let a = [];
      while (Math.random() < 0.95) {
        a.push({x: Math.round(Math.random() * 100), y: Math.round(Math.random() * 100)});
      }
      return a;
    })()
  });

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
  
  const actions = keypressActions;

  function updateState(oldState, action) {
    let newState;
    switch (action.action) {
      case 'SOUTH':
        newState = {
          player: {
            x: oldState.player.x,
            y: oldState.player.y + 1
          },
          puppy: oldState.puppy
        };
        break;
      case 'NORTH':
        newState = {
          player: {
            x: oldState.player.x,
            y: oldState.player.y - 1
          },
          puppy: oldState.puppy
        };
        break;
      case 'WEST':
        newState = {
          player: {
            x: oldState.player.x - 1,
            y: oldState.player.y
          },
          puppy: oldState.puppy
        };
        break;
      case 'EAST':
        newState = {
          player: {
            x: oldState.player.x + 1,
            y: oldState.player.y
          },
          puppy: oldState.puppy
        };
        break;
      default:
        newState = oldState;
    }
    newState.npcs = oldState.npcs;
    if (Math.abs(newState.player.x - newState.puppy.x) < 5 && 
        Math.abs(newState.player.y - newState.puppy.y) < 5 ) {
      newState.win = true;
    }
    return newState;
  }

  flyd.on(action => state(updateState(state(), action)), actions);

  const vdom = flyd.map(newState => createVDom(newState), state);

  function createVDom(localState) {
    return h('div.field', [
      localState.win ? h('h1', 'You won!!!') :
        h('svg', {attrs: {width: '100%', height: '100%'}}, [
         createSVGWithClass(localState.player, 'player'),
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
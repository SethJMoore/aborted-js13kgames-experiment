const flyd = require("flyd");
const snabbdom = require("snabbdom");
const h = require("snabbdom/h").default;
const patch = snabbdom.init([require("snabbdom/modules/attributes").default]);

function componentOne(state) {

  state({
    player: {
      location: {x: 0, y: 0},
      destination: {x: 0, y: 0}
    },
    puppy: {
      location: {x: 0, y: 0},
      destination: {x: 0, y: 0}
    },
    npcs: []
  });

  function randomFieldLocation() {
    return {
      x: Math.round(Math.random() * document.getElementById('field').clientWidth),
      y: Math.round(Math.random() * document.getElementById('field').clientHeight)
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

  const updateActions = flyd.stream();
  
  const actions = flyd.merge(updateActions, clickActions)

  function updateState(oldState, action) {
    if (oldState.win) {
      return oldState;
    }
    let newState = oldState;
    switch (action.action) {
      case 'SETUP':
        newState.puppy.location =
          newState.puppy.destination = randomFieldLocation();
        newState.npcs = (() => {
          let a = [];
          while (Math.random() < 0.95) {
            let npc = {
              location: randomFieldLocation(),
              destination: randomFieldLocation()
            };
            a.push(npc);
          }
          return a;
        })();
        break;
      case 'CHANGE_DEST':
        newState.player.destination = action.destination;
        break;
      case 'UPDATE':
        newState.player.location = moveToward(oldState.player.location,
                                              oldState.player.destination);
        newState.puppy.location = moveToward(oldState.puppy.location,
                                              oldState.puppy.destination);
        newState.npcs = oldState.npcs.map(el => {
          let newLoc = moveToward(el.location, el.destination);
          // Side effects in my map function? Tsk, tsk.
          if (Math.abs(newLoc.x - newState.puppy.location.x) < 10 &&
              Math.abs(newLoc.y - newState.puppy.location.y) < 10 ) {
            newState.puppy.destination = el.metPlayer || oldState.puppy.destination;
          }
          return {
            location: newLoc,
            destination: (newLoc.x === el.destination.x &&
                          newLoc.y === el.destination.y) ?
                          randomFieldLocation() :
                          el.destination,
            metPlayer: el.metPlayer ? el.metPlayer :
              (Math.abs(newLoc.x - newState.player.location.x) < 10 &&
               Math.abs(newLoc.y - newState.player.location.y) < 10 ) ?
                newState.player.location :
                undefined
          };
        });
        if (Math.abs(newState.player.location.x - newState.puppy.location.x) < 5 &&
            Math.abs(newState.player.location.y - newState.puppy.location.y) < 5 ) {
          newState.win = true;
        }
        break;
      default:
        newState = oldState;
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
    return h('div#field.field', {attrs: {style: 'height:' + window.innerHeight + 'px;'}}, [
      localState.win ? h('h1', 'You won!!!') :
        h('svg', {attrs: {width: '100%', height: '100%'}}, [
         createSVGWithClass(localState.player.location, 'player'),
         createSVGWithClass(localState.puppy.location, 'puppy'),
       ].concat(localState.npcs.map(npc =>
         createSVGWithClass(npc.location, 'npc' + (npc.metPlayer ? ' met' : '')))))
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
    actions({action: 'SETUP'});
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

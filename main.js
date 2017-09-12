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
        let npc = {
          location: randomFieldLocation(),
          destination: randomFieldLocation()
        };
        a.push(npc);
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

  const updateActions = flyd.stream();
  
  const actions = flyd.merge(updateActions, clickActions)

  function updateState(oldState, action) {
    let newState = oldState;
    switch (action.action) {
      case 'CHANGE_DEST':
        newState.player.destination = action.destination;
        break;
      case 'UPDATE':
        newState.player.location = moveToward(oldState.player.location,
                                              oldState.player.destination);
        newState.npcs = oldState.npcs.map(el => ({
          location: moveToward(el.location, el.destination),
          destination: (el.location.x === el.destination.x &&
                        el.location.y === el.destination.y) ?
                        randomFieldLocation() :
                        el.destination
        })
      );
        break;
      default:
        newState = oldState;
    }
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
       ].concat(localState.npcs.map(npc =>
         createSVGWithClass(npc.location, 'npc'))))
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
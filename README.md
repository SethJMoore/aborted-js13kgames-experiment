# aborted-js13kgames-experiment

A little project I created to possibly submit to the [2017 Js13kGames competition](http://2017.js13kgames.com/).
I started late and didn't really get it to a state where I would be comfortable submitting it before I got distracted by
dealing with Hurricane Irma stuff, so I missed out on getting a t-shirt.

Though I would have liked to do it with [Cycle.js](https://cycle.js.org/), I needed to keep the code size to a minimum, so I
found [Flyd](https://github.com/paldepind/flyd) for a lightweight functional reactive programming library and ended up going
with [Snabbdom](https://github.com/snabbdom/snabbdom) for a virtual DOM library after initially starting with
[Maquette](https://maquettejs.org/).

To build for yourself, run the following from the command line:
```bash
git clone https://github.com/SethJMoore/aborted-js13kgames-experiment.git
cd aborted-js13kgames-experiment/
yarn install
npm run build
open public/index.html
```
You could probably replace ```yarn install``` with ```npm install``` if you don't have [Yarn](https://yarnpkg.com) installed.

### [Check out a live version.](https://sethjmoore.github.io/aborted-js13kgames-experiment)
You've lost your puppy (the blue dot) and you (red dot) go around telling people (white dots).
Anyone you run into will send your puppy to where they met you if they run into it.
Click anywhere to move yourself toward click location. You can win by going directly to your puppy,
but where's the fun in that?

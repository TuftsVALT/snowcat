# D3M App

This repo holds contains work developed by research labs at Tufts University, Georgia Tech, and University of Wisconsin in relation to DARPA's Data Driven Discovery of Models program.

The goal of this application is to support Human in the Loop (HIL) data analysis, connecting users with complex machine learning algorithms to model a wide array of data types.

This application contains a vueJS, nodeJS, and python project that represents our TA3 app.  It has a web server done in node.js.  It also contains some data processing scripts, in `lib/external`, that are called through node's `child_process` [library](https://nodejs.org/api/child_process.html).  This node project includes a frontend that communicates with the server.

This is our Summer 2018 version, to be used for our upcoming evaluation.

## Installation

Our application is split into two servers: The `node.js` middleware, found in `node_middleware`, and the `vue.js` frontend, found in `vue_frontend`.  You need to run installation commands in both directores.

Once installation is done, test it out.  Two servers need to be run, actually - the node server supporting GRPC and web socket communication, and a server for the vue assets.  They are coupled in a single command.  From the application root,

	bash ta3_search shared/static/config_files/dev_mode/example_dev_regression_config.json


### Node Middleware

All instructions should be run from within `node_middleware`.

We are running python3 on the backend.

We also require node version >= 8.0.  __If you get an error during the server startup, double check that you have the right node version.__

All commands below are assuming you are in the application root.  Install the backend dependencies.  Assuming you have `pip` installed,

    pip3 install -r python-requirements.txt

Install the node dependencies.

    yarn

### Vue Frontend

All instructions should be run from within `vue_frontend`

Install the node dependencies.

    yarn

### Potential Docker Installation

The middleware communicates with the frontend over two ports - 3000 for the web front end, and 8080 for the web socket.  Those will need to be opened.  Presumably we'll need a port for the grpc as well.

###  Running different config files for testing.

In an effort to streamline our manual testing, the repository comes with some sample datasets and sample configuration files.  The sample datasets are smaller versions of the raw datasets, so that they don't bloat the repository.

**Please do not check in full datasets if they are larger than 2-5 mb**.  Instead, just copy limited versions of the datasets by only copying a few of the media files in, and shortening the `learningData.csv` files to a few thousand lines.

#### Development mode

All of these configuration files provide their own predictions files - they do not connect to the TA2.

	- `example_dev_classification_config.json`
	- `example_dev_collabfilter_config.json`
	- `example_dev_graphmatch_config.json`
	- `example_dev_images_config.json`
	- `example_dev_linkpred_config.json`
	- `example_dev_regression_config.json`
	- `example_dev_text_classification_config.json`
	- `example_dev_time_series_classification_config.json`
	- `example_dev_time_series_forecast_config.json`

For any of these __they should only reference data that is kept within the repository__.  And again, we should only put small datasets into the repository.

### Using tinyconf for testing in development mode

To test any of the data sets in `static/local_testing_data/` in evaluation mode, no explicit json file is needed.
Instead, data sets can be selected by running the backend server with an additional `dataset:` parameter

    yarn run server dataset:dro

selects the first data set stored as a subfolder of `static/local_testing_data/` whose name contains the string `dro`. It then generates a configuration for it and starts the server with it in evaluation mode.
To generate a development mode config file, add `dev:` after `dataset:`, for example:

    yarn run server dataset:dev:dro

#### Demo mode

We also have a demo mode (if you checkout the `demo` branch) that lets the user refresh the page to view a different data and problem type, rather than restarting the server.  To run this, just pass the `--demo` flag instead of passing in a configuration file.

	bash ta3_search --demo

#### Evaluation mode

For evaluation mode, we expect to connect with a TA2, and we need to use configuration files that explicitly adhere to the configuration we expect to receive from NIST.

Because this must be served from docker, it's still being figured out how to do this - we need to make sure the data is available within the TA2's docker container.

The local port the TA2 system is listening on can be set by the evnironment variable `TA2_PORT`. Default value is `50051`.

### Contributing

All contributions should done by making a feature branch, pushing that feature branch to github, and creating a pull request.  It's best to make the pull request while you're still working, by making the title start with "WIP: ", so that others can discuss the changes you are proposing.

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Architecture

The architecture for the vue app is a little different.  The most basic way to set up the vue scaffolding was actually to run two servers.  One server compiles and serves the javascript, CSS, and other assets (through webpack).  The other server is our old node server, independent from vue.  The vue front end communicates with the node backend through web sockets.

Both servers are started up via the `ta3_search` command.  The config file you provide to that command, as its first argument, dictates the dataset and problem type that is being used.

	bash ta3_search shared/static/config_files/dev_mode/example_dev_regression_config.json

We have to develop components that all work with a global store of data.  I'll give an example with Classification.

On startup, the front end and back end both read the configuration file `example_dev_classification_config.json`.  In vue, that gets read into the global store object, which is accessible within any component:

	this.$store.state

For more information on the store, see the documentation: https://vuex.vuejs.org/en/

The components that render should be rendered conditionally based on the configuration you pass into the startup command.  This is currently a work in process.  Ideally, it should work as follows.  For the classification configuration file, in the vue templates, our app checks to see what the problem type is.  Since it's classification, it renders my `ClassificationModelComparison.vue` component.  That component will have all of the frontend javascripting for scatterplots and the like (it doesn't have it right now).  It also calls to the node backend for any preprocessing scripts.

Ideally, our architecture would have node calling out to a python Flask server to run backend scripts.  For now, it just uses the node `child_process` library to call python scripts.

So, for now, if you are working on a component, you have to do the following steps.

1. Make a new config file that changes things to your problem type (points to graph data if you are doing graph data, changes the problem type to regression if you are doing regression).
2. Add the conditional in the vue template to render a vue component specific to your visualization, based on your problem type / data type.
3. Make your vue component file.  This should be a card in the `src/components/cards/` directory.  I'm sure we'll be sharing a lot of frontend technologies between components, but for now, just work on your own and we'll merge the dependencies later.
4. If your component needs any background processing, put a lifecycle hook (https://vuejs.org/v2/api/#Options-Lifecycle-Hooks) that uses the websocket to call to our node server.  Then, in our node folder (`node_middleware`), make a controller folder that includes a receiving endpoint for that call that will use `child_process` to call out to your script.  Then, put your script in our `lib` directory.  For an example, see `v2/lib/external/project_data.py`.  Any supporting javascript files that are run on the node server should go in the created controllers folder.

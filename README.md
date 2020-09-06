# D3M App

This repo holds contains source code for **CAVA**, or Columnar data Augmentation through Visual Analytics, a visual analytics tool for column-wise data augmentation using knowledge graphs.  This work was developed by visual analytics research labs at Tufts University, Georgia Tech, and University of Wisconsin in relation to DARPA's Data Driven Discovery of Models program.

The goal of this application is to make it easy to add on additional columns to a tabular dataset by mining knowledge graphs.  Currently, this application only supports connecting to wikidata.

CAVA lets users upload a dataset and then search through wikidata for related attributes of different columns.  For example, if a dataset has a column consisting of U.S. cities, CAVA will return a list of attributes shared by U.S. cities in wikidata, and let the user join them to their CSV and download the augmented dataset.  It also supports more complex augmented attributes, like joining a country's average neighbor GDP.

CAVA consists of a front end user interface that lives in the browser, and a backend server that preprocesses data and calls out to the knowledge graph.  Both front and backend need to be served in order to use CAVA.

This application contains a vueJS, nodeJS, and python project.  In includes some legacy code from a larger application that included more data exploration and connection to a machine learning backend, but it has been pared down to only focus on column data augmentation.  It has a web server done in node.js.  It also contains some data processing scripts, in `lib/external`, that are called through node's `child_process` [library](https://nodejs.org/api/child_process.html).  This node project includes a frontend in vueJS that communicates with the server.

This is our Summer 2020 version, to be used for our upcoming evaluation in the data driven discovery of models program.

## Installation

Our application is split into two servers: The `node.js` middleware, found in `node_middleware`, and the `vue.js` frontend, found in `vue_frontend`.  You need to run installation commands in both directores.

Once installation is done, test it out.  Two servers need to be run, actually - the node server supporting GRPC and web socket communication, and a server for the vue assets.  They are coupled in a single command.  From the application root,

	bash ta3_search shared/static/local_testing_data/185_baseball

If you run the `ta3_search` bash script without a dataset, the user is able to upload a CSV dataset themselves.

### Node Middleware

All instructions should be run from within the `node_middleware` directory.

We are running python3 on the backend.

We also require node version >= 8.0.  __If you get an error during the server startup, double check that you have the right node version.__

Assuming you have `pip` installed,

    pip3 install -r python-requirements.txt

Install the node dependencies.

    yarn install

#### Problems with static

You might find that the server reports issues with the 'static' folder.  This folder should be symlinked with the static folder in `shared/`, but sometimes this doesn't come through right in the git repo.  If so, delete the empty file `node_middleware/static`, and then create a new symlink from the `node_middleware/shared` directory

        ln -nfs ../../shared/static staticd

The same thing might occur with the `output/` directory as well.

        ln -nfs ../../shared/output output

### Vue Frontend

All instructions should be run from within `vue_frontend`

Install the node dependencies.

    yarn install

### Potential Docker Installation

The middleware communicates with the frontend over two ports - 3000 for the web front end, and 8080 for the web socket.  Those will need to be opened if this is run in a docker container.  A compatible Dockerfile is included in this repository.

###  Running different config files for testing.

In an effort to streamline our manual testing, the repository comes with some sample datasets and sample configuration files.  The sample datasets are smaller versions of the raw datasets, so that they don't bloat the repository.

**Please do not check in full datasets if they are larger than 2-5 mb**.  Instead, just copy limited versions of the datasets by only copying a few of the media files in, and shortening the `learningData.csv` files to a few thousand lines.

### Contributing

All contributions should done by making a feature branch, pushing that feature branch to github, and creating a pull request.  It's best to make the pull request while you're still working, by making the title start with "WIP: ", so that others can discuss the changes you are proposing.

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Architecture

The architecture for the vue app is a little different.  The most basic way to set up the vue scaffolding was actually to run two servers.  One server compiles and serves the javascript, CSS, and other assets (through webpack).  The other server is our old node server, independent from vue.  The vue front end communicates with the node backend through web sockets.

Both servers are started up via the `ta3_search` command.  The config file you provide to that command, as its first argument, dictates the dataset and problem type that is being used.

	bash ta3_search shared/static/local_testing_data/196_autoMpg dev

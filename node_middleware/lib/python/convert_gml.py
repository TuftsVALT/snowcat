#!/bin/python

#converts gml graph file to json
#usage: <gml file>
#prints resulting json to stdout

import csv, json, sys, os
import networkx as nx
from networkx.readwrite import json_graph

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def oprint(*args, **kwargs):
    print(*args, file=sys.stdout, end='', **kwargs)

#FIXME: REMOVE REPLACE .json at some point
gml_file = sys.argv[1].replace('//', '/').replace('.json', '.gml')
#oprint("converting file: " + gml_file)

G = nx.read_gml(gml_file, label="id")
num_nodes = G.number_of_nodes()
num_edges = G.number_of_edges()

#check size of file first
#file_size = os.path.getsize(gml_file) // (1024 * 1024)
#if (file_size > 10):
if (num_nodes > 5001 or num_edges > 10000):
    #file too large
    oprint('{{"too_large": true, "nodes": {}, "edges": {}, "data": null}}'.format(num_nodes, num_edges))
else:
    node_link = json_graph.node_link_data(G)
    json_dump = json.dumps(node_link)
    oprint('{{"too_large": false, "nodes": {}, "edges": {}, "data": '.format(num_nodes, num_edges))
    oprint(json_dump)
    oprint('}')

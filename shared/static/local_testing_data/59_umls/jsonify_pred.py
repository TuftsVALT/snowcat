#!/bin/python

import csv, json

out_file = "/home/flo/uni/code/d3mapp/v2/static/data/59_umls/59_umls_solution/predictions.json"
pred_file = "/home/flo/uni/code/d3mapp/v2/static/data/59_umls/59_umls_solution/predictions.csv"
train_data_file = "/home/flo/uni/code/d3mapp/v2/static/data/59_umls/59_umls_dataset/tables/learningData.csv"

d3mIndices = {}
with open(train_data_file, 'r') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        d3mIndices[int(row['d3mIndex'])] = (int(row['source_nodeID']), int(row['target_nodeID']))

pred_list = []
with open(pred_file, 'r') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        if int(row['linkExists']):
            pred_list.append(d3mIndices[int(row['d3mIndex'])])

with open(out_file, 'w') as outfile:
    outfile.write(json.dumps(pred_list))

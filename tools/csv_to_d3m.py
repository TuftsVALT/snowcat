import sys
import os
import json
import pandas as pd

ARGS = sys.argv[1:]

if (len(ARGS) < 2):
    print("This script converts single csv files (with headers) into D3M datasets.")
    print("If no output folder is provided, the dataset name is used.")
    print("Usage: <input csv><dataset name>[<output folder>]")
    sys.exit(1)

INPUT_CSV = ARGS[0]
DATASET_NAME = ARGS[1]
OUTPUT_FOLDER = os.path.abspath(DATASET_NAME)
if (len(ARGS) > 2):
    OUTPUT_FOLDER = os.path.abspath(ARGS[3])

print("Reading file '{}' and converting to dataset with name '{}' in folder '{}'.".format(
    INPUT_CSV, DATASET_NAME, OUTPUT_FOLDER))

data = pd.read_csv(INPUT_CSV)
# index column gets the name d3mIndex (to write it out to csv)
data.index.name = "d3mIndex"

# create the folder structure
# we only create the dataset folder for now
os.mkdir(OUTPUT_FOLDER)
ABS_DATASET_PATH = OUTPUT_FOLDER + "/" + DATASET_NAME + "_dataset"
os.mkdir(ABS_DATASET_PATH)
ABS_TABLES_PATH = ABS_DATASET_PATH + "/tables"
os.mkdir(ABS_TABLES_PATH)

# now write data back to new csv file
data.to_csv(ABS_TABLES_PATH + "/learningData.csv")

# new generate json structure for dataset (as python object)
obj = {}
obj["about"] = {}
obj["about"]["datasetID"] = DATASET_NAME,
obj["about"]["datasetName"] = DATASET_NAME,
obj["about"]["description"] = ""
obj["about"]["citation"] = ""
obj["about"]["license"] = ""
obj["about"]["source"] = ""
obj["about"]["sourceURI"] = ""
obj["about"]["approximateSize"] = ""
obj["about"]["datasetSchemaVersion"] = "3.2.0"
obj["about"]["redacted"] = False
obj["about"]["datasetVersion"] = "2.0"
obj["about"]["digest"] = ""

# new generate column meta data
cols = []
for index, name in enumerate(["d3mIndex"] + data.columns.tolist()):
    cols.append({
        "colIndex": index,
        "colName": name,
        "colType": "unknown",
        "role": ["index"] if (index == 0) else ["attribute"],
    })

# and assign to object
obj["dataResources"] = [{
    "resID": "learnindData",
    "resPath": "tables/learningData.csv",
    "resType": "table",
    "resFormat": ["text/csv"],
    "isCollection": False,
    "columns": cols,
}]


with open(ABS_DATASET_PATH + "/datasetDoc.json", "w") as outfile:
    outfile.write(json.dumps(obj, indent=2))

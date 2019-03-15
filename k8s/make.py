#!/usr/bin/env python3
from ruamel.yaml import YAML
from pathlib import Path
import glob, os
from random import randint

yaml = YAML()
yamlPath = Path('test.yaml')

data = yaml.load(yamlPath)


confPaths = glob.glob('../static/config_files/dev_mode/*.json')
names = ['-'.join(os.path.basename(path).split('_')[2:-1]) for path in confPaths]

randSet = set()
for path, name in zip(confPaths, names):
    outPath = 'test_' + name + '.yaml'
    data['spec']['containers'][0]['args'] = [ path[3:] ]
    randPort = randint(100, 999)
    while randPort in randSet:
        randPort = randint(100, 999)
    data['spec']['containers'][0]['ports'][0]['hostPort'] = 9000 + randPort
    data['metadata']['name'] = 'tufts-' + name + '-demo'
    yaml.dump(data, Path(outPath))

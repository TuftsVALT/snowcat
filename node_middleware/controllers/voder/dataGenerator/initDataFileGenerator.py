import sys, csv, json

tests = [
	(int, int),
	(float, float)
]

def getType(value):
	for valueType, test in tests:
		try:
			test(value)
			return "quantitative"
		except ValueError:
			continue
	return "nominal"

def jsonFormat(fields, items):
	jsonObject = {}
	index = 0
	for field, item in zip(fields[1:], items[1:]):
		if(index == 0 and getType(item) == 'nominal'):
			index += 1
			jsonObject[field] = {
				'type':getType(item),
				'isItemAttr':'y'
			}
		elif(index == 0 and getType(item) != 'nominal'):
			index += 1
			jsonObject[field] = {
				'type':'nominal',
				'isItemAttr':'y'
			}
		else:
			jsonObject[field] = {
				'type':getType(item)
			}
	return jsonObject

if __name__ == '__main__':
	inputCSV = sys.argv[1] # raw data
	outputDir = sys.argv[2] # where to write voder files

	fields = []
	items = []

	with open(inputCSV) as csvFile:
		csvReader = csv.reader(csvFile)
		fields = next(csvReader)
		items = next(csvReader)

		csvFile.seek(0)

		csvDataFile = outputDir + 'output.csv'
		jsonDataTypeMaps = outputDir + 'output.json'

		with open(csvDataFile, 'w') as dataFile:
			writer = csv.writer(dataFile)
			for row in csv.reader(csvFile):
				writer.writerow(row[1:])

		# print("wrote to CSV data file")
		# csvFile.seek(0)

		# with open(csvDataGenerator, 'w') as outputFile:
		# 	writer = csv.writer(outputFile)
		# 	for row in csv.reader(csvFile):
		# 		writer.writerow(row[1:])

	with open(jsonDataTypeMaps, 'w') as jsonFile:
		json.dump(jsonFormat(fields, items), jsonFile, indent=4)





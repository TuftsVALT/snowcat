function getMappedType(mapping, myType) {
  if (myType && mapping[myType]) {
    return mapping[myType];
  } else {
    return mapping["undefined"];
  }
};

module.exports = getMappedType;
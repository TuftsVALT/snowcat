class Problem {
  constructor(pathOrSchema, isProblemPath) {
    if (isProblemPath) {
      this.problemPath = pathOrSchema;
      this.problemSchema = require(this.problemPath + "/problemDoc.json");
    } else {
      this.problemSchema = pathOrSchema;
      this.problemPath = null;
    }
    // if (typeof source === "string") {
    //   let problemPath = source;
    //   this.problemPath = problemPath;
    //   if (this.problemPath.endsWith("/problemDoc.json")) {
    //     this.problemPath = this.problemPath.substring(
    //       0,
    //       this.problemPath.length - 16
    //     );
    //   }
    //   console.log("Create problem from:", this.problemPath);
    //   this.problemSchema = require(this.problemPath + "/problemDoc.json");
    // }

    // else if (typeof source === "object") {
    //   console.log("isDarpa:", source.isDarpa);
    //   if (source.isDarpa) {

    //     this.problemPath = null;

    //   } else {
    //     console.log("loading problem from memory");
    //     this.problemPath = null;

    //   }
    //   this.problemSchema = translate(source);

    // }

    // console.log(this.getProblemSchema());
  }
  getProblemPath() {
    if (!this.problemPath) {
      console.log("WARN: problemPath is", this.problemPath);
    }
    return this.problemPath;
  }
  getProblemSchema() {
    return this.problemSchema;
  }
  getId() {
    if (this.getProblemSchema() && this.getProblemSchema().problemID) {
      return this.getProblemSchema().problemID;
    } else {
      return "PROBLEM ID::" + this.getProblemPath();
    }
  }
}
module.exports = Problem;
// now get schema from path
// let files = fs
//   .readdirSync(problemPath)
//   .filter(filename => filename.toLowerCase().endsWith("_problem"));
// if (files.length != 1) {
//   console.log(
//     "None or more than one folder that ends in '_dataset'; can't find schema!"
//   );
//   this.problemSchema = null;
// } else {
//   let problemPath = path;
//   if (!problemPath.endsWith("/")) {
//     problemPath = problemPath + "/";
//   }
//   problemPath = problemPath + files[0];
//   this.problemSchema = require(problemPath + "/problemDoc.json");

// }

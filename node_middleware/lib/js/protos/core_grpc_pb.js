// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var core_pb = require('./core_pb.js');
var google_protobuf_descriptor_pb = require('google-protobuf/google/protobuf/descriptor_pb.js');

function serialize_PipelineCreateRequest(arg) {
  if (!(arg instanceof core_pb.PipelineCreateRequest)) {
    throw new Error('Expected argument of type PipelineCreateRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineCreateRequest(buffer_arg) {
  return core_pb.PipelineCreateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PipelineCreateResult(arg) {
  if (!(arg instanceof core_pb.PipelineCreateResult)) {
    throw new Error('Expected argument of type PipelineCreateResult');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineCreateResult(buffer_arg) {
  return core_pb.PipelineCreateResult.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PipelineCreateResultsRequest(arg) {
  if (!(arg instanceof core_pb.PipelineCreateResultsRequest)) {
    throw new Error('Expected argument of type PipelineCreateResultsRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineCreateResultsRequest(buffer_arg) {
  return core_pb.PipelineCreateResultsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PipelineDeleteRequest(arg) {
  if (!(arg instanceof core_pb.PipelineDeleteRequest)) {
    throw new Error('Expected argument of type PipelineDeleteRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineDeleteRequest(buffer_arg) {
  return core_pb.PipelineDeleteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PipelineExecuteRequest(arg) {
  if (!(arg instanceof core_pb.PipelineExecuteRequest)) {
    throw new Error('Expected argument of type PipelineExecuteRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineExecuteRequest(buffer_arg) {
  return core_pb.PipelineExecuteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PipelineExecuteResult(arg) {
  if (!(arg instanceof core_pb.PipelineExecuteResult)) {
    throw new Error('Expected argument of type PipelineExecuteResult');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineExecuteResult(buffer_arg) {
  return core_pb.PipelineExecuteResult.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PipelineExecuteResultsRequest(arg) {
  if (!(arg instanceof core_pb.PipelineExecuteResultsRequest)) {
    throw new Error('Expected argument of type PipelineExecuteResultsRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineExecuteResultsRequest(buffer_arg) {
  return core_pb.PipelineExecuteResultsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PipelineExportRequest(arg) {
  if (!(arg instanceof core_pb.PipelineExportRequest)) {
    throw new Error('Expected argument of type PipelineExportRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineExportRequest(buffer_arg) {
  return core_pb.PipelineExportRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PipelineListRequest(arg) {
  if (!(arg instanceof core_pb.PipelineListRequest)) {
    throw new Error('Expected argument of type PipelineListRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineListRequest(buffer_arg) {
  return core_pb.PipelineListRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PipelineListResult(arg) {
  if (!(arg instanceof core_pb.PipelineListResult)) {
    throw new Error('Expected argument of type PipelineListResult');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_PipelineListResult(buffer_arg) {
  return core_pb.PipelineListResult.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Response(arg) {
  if (!(arg instanceof core_pb.Response)) {
    throw new Error('Expected argument of type Response');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_Response(buffer_arg) {
  return core_pb.Response.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_SessionContext(arg) {
  if (!(arg instanceof core_pb.SessionContext)) {
    throw new Error('Expected argument of type SessionContext');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_SessionContext(buffer_arg) {
  return core_pb.SessionContext.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_SessionRequest(arg) {
  if (!(arg instanceof core_pb.SessionRequest)) {
    throw new Error('Expected argument of type SessionRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_SessionRequest(buffer_arg) {
  return core_pb.SessionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_SessionResponse(arg) {
  if (!(arg instanceof core_pb.SessionResponse)) {
    throw new Error('Expected argument of type SessionResponse');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_SessionResponse(buffer_arg) {
  return core_pb.SessionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_UpdateProblemSchemaRequest(arg) {
  if (!(arg instanceof core_pb.UpdateProblemSchemaRequest)) {
    throw new Error('Expected argument of type UpdateProblemSchemaRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_UpdateProblemSchemaRequest(buffer_arg) {
  return core_pb.UpdateProblemSchemaRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var CoreService = exports.CoreService = {
  // Train step - multiple result messages returned via GRPC streaming.
  createPipelines: {
    path: '/Core/CreatePipelines',
    requestStream: false,
    responseStream: true,
    requestType: core_pb.PipelineCreateRequest,
    responseType: core_pb.PipelineCreateResult,
    requestSerialize: serialize_PipelineCreateRequest,
    requestDeserialize: deserialize_PipelineCreateRequest,
    responseSerialize: serialize_PipelineCreateResult,
    responseDeserialize: deserialize_PipelineCreateResult,
  },
  // Predict step - multiple results messages returned via GRPC streaming.
  executePipeline: {
    path: '/Core/ExecutePipeline',
    requestStream: false,
    responseStream: true,
    requestType: core_pb.PipelineExecuteRequest,
    responseType: core_pb.PipelineExecuteResult,
    requestSerialize: serialize_PipelineExecuteRequest,
    requestDeserialize: deserialize_PipelineExecuteRequest,
    responseSerialize: serialize_PipelineExecuteResult,
    responseDeserialize: deserialize_PipelineExecuteResult,
  },
  // Manage pipelines already present in the session.
  listPipelines: {
    path: '/Core/ListPipelines',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.PipelineListRequest,
    responseType: core_pb.PipelineListResult,
    requestSerialize: serialize_PipelineListRequest,
    requestDeserialize: deserialize_PipelineListRequest,
    responseSerialize: serialize_PipelineListResult,
    responseDeserialize: deserialize_PipelineListResult,
  },
  deletePipelines: {
    path: '/Core/DeletePipelines',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.PipelineDeleteRequest,
    responseType: core_pb.PipelineListResult,
    requestSerialize: serialize_PipelineDeleteRequest,
    requestDeserialize: deserialize_PipelineDeleteRequest,
    responseSerialize: serialize_PipelineListResult,
    responseDeserialize: deserialize_PipelineListResult,
  },
  // Obtain results
  getCreatePipelineResults: {
    path: '/Core/GetCreatePipelineResults',
    requestStream: false,
    responseStream: true,
    requestType: core_pb.PipelineCreateResultsRequest,
    responseType: core_pb.PipelineCreateResult,
    requestSerialize: serialize_PipelineCreateResultsRequest,
    requestDeserialize: deserialize_PipelineCreateResultsRequest,
    responseSerialize: serialize_PipelineCreateResult,
    responseDeserialize: deserialize_PipelineCreateResult,
  },
  getExecutePipelineResults: {
    path: '/Core/GetExecutePipelineResults',
    requestStream: false,
    responseStream: true,
    requestType: core_pb.PipelineExecuteResultsRequest,
    responseType: core_pb.PipelineExecuteResult,
    requestSerialize: serialize_PipelineExecuteResultsRequest,
    requestDeserialize: deserialize_PipelineExecuteResultsRequest,
    responseSerialize: serialize_PipelineExecuteResult,
    responseDeserialize: deserialize_PipelineExecuteResult,
  },
  // Export executable of a pipeline, including any optional preprocessing used in session
  exportPipeline: {
    path: '/Core/ExportPipeline',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.PipelineExportRequest,
    responseType: core_pb.Response,
    requestSerialize: serialize_PipelineExportRequest,
    requestDeserialize: deserialize_PipelineExportRequest,
    responseSerialize: serialize_Response,
    responseDeserialize: deserialize_Response,
  },
  // Update problem schema
  updateProblemSchema: {
    path: '/Core/UpdateProblemSchema',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.UpdateProblemSchemaRequest,
    responseType: core_pb.Response,
    requestSerialize: serialize_UpdateProblemSchemaRequest,
    requestDeserialize: deserialize_UpdateProblemSchemaRequest,
    responseSerialize: serialize_Response,
    responseDeserialize: deserialize_Response,
  },
  // Session management
  startSession: {
    path: '/Core/StartSession',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.SessionRequest,
    responseType: core_pb.SessionResponse,
    requestSerialize: serialize_SessionRequest,
    requestDeserialize: deserialize_SessionRequest,
    responseSerialize: serialize_SessionResponse,
    responseDeserialize: deserialize_SessionResponse,
  },
  endSession: {
    path: '/Core/EndSession',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.SessionContext,
    responseType: core_pb.Response,
    requestSerialize: serialize_SessionContext,
    requestDeserialize: deserialize_SessionContext,
    responseSerialize: serialize_Response,
    responseDeserialize: deserialize_Response,
  },
};

exports.CoreClient = grpc.makeGenericClientConstructor(CoreService);

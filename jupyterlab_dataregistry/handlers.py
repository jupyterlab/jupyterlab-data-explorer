import json
import traceback

from jupyter_core.paths import jupyter_data_dir
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from tornado import web

from .utils import dict_to_snake
from .dataregistry import AlreadyExistsError, DataRegistry, NotFoundError
from .dataset import Dataset


class RegisterHandler(APIHandler):
    @web.authenticated
    def post(self):
        body = self.get_json_body()
        body = dict_to_snake(body)
        try:
            dataset = Dataset(**body)
            __DATA_REGISTRY__.register_dataset(dataset)
            self.finish(json.dumps(dataset.to_dict(True)))
        except AlreadyExistsError as e:
            raise web.HTTPError(500, str(e)) from e
        except TypeError as e:
            raise web.HTTPError(
                500, "Missing fields in JSON data: " + str(e).split(":")[-1]
            ) from e
        except Exception as e:
            print(traceback.format_exc())
            raise web.HTTPError(500, str(e)) from e


class UpdateHandler(APIHandler):
    @web.authenticated
    def put(self):
        body = self.get_json_body()
        body = dict_to_snake(body)
        try:
            dataset = Dataset(**body)
            __DATA_REGISTRY__.update_dataset(dataset)
            self.finish(json.dumps(dataset.to_dict(True)))
        except AlreadyExistsError as e:
            raise web.HTTPError(500, str(e)) from e
        except TypeError as e:
            raise web.HTTPError(
                500, "Missing fields in JSON data: " + str(e).split(":")[-1]
            ) from e
        except Exception as e:
            raise web.HTTPError(500, str(e)) from e


class QueryHandler(APIHandler):
    @web.authenticated
    def get(self):
        abstract_data_type = self.get_query_argument("abstractDataType", None)
        serialization_type = self.get_query_argument("serializationType", None)
        storage_type = self.get_query_argument("storageType", None)

        datasets = __DATA_REGISTRY__.query_dataset(
            abstract_data_type=abstract_data_type,
            serialization_type=serialization_type,
            storage_type=storage_type,
        )
        response = [d.to_dict(True) for d in datasets]
        self.finish(json.dumps(response))


class GetDatasetHandler(APIHandler):
    @web.authenticated
    def get(self):
        id = self.get_query_argument("id")
        version = self.get_query_argument("version", None)
        try:
            dataset = __DATA_REGISTRY__.get_dataset(id, version)
            self.finish(json.dumps(dataset.to_dict(True)))
        except NotFoundError as e:
            raise web.HTTPError(
                404, f"Dataset with id: {id} and version: {version} not found."
            )
        except Exception as e:
            raise web.HTTPError(500, str(e))


class HasDatasetHandler(APIHandler):
    @web.authenticated
    def head(self):
        id = self.get_query_argument("id")
        version = self.get_query_argument("version", None)

        has_dataset = __DATA_REGISTRY__.has_dataset(id, version)
        self.finish()


class RegisterCommandHandler(APIHandler):
    @web.authenticated
    def post(self):
        params = self.get_json_body()
        try: 
            command_id = params["commandId"]
            abstract_data_type = params["abstractDataType"]
            serialization_type = params["serializationType"]
            storage_type = params["storageType"]

            __DATA_REGISTRY__.register_command(
                command_id=command_id,
                abstract_data_type=abstract_data_type,
                serialization_type=serialization_type,
                storage_type=storage_type,
            )

            self.finish(
                json.dumps(
                    {"message": f"Command with id: {command_id} registered successfully."}
                )
            )

        except KeyError as e:
            raise web.HTTPError(
                500, "Missing fields in JSON data: " + str(e).split(":")[-1]
            ) from e
        except Exception as e:
            raise web.HTTPError(500, str(e)) from e


class GetCommandsHandler(APIHandler):
    @web.authenticated
    def get(self):
        abstract_data_type = self.get_query_argument("abstractDataType")
        serialization_type = self.get_query_argument("serializationType")
        storage_type = self.get_query_argument("storageType")

        commands = __DATA_REGISTRY__.get_commands(
            abstract_data_type=abstract_data_type,
            serialization_type=serialization_type,
            storage_type=storage_type,
        )

        self.finish(json.dumps(commands))


def setup_handlers(web_app):
    host_pattern = ".*$"
    namespace = "dataregistry"

    handlers_with_path = [
        ("registerDataset", RegisterHandler),
        ("updateDataset", UpdateHandler),
        ("queryDataset", QueryHandler),
        ("getDataset", GetDatasetHandler),
        ("hasDataset", HasDatasetHandler),
        ("registerCommand", RegisterCommandHandler),
        ("getCommands", GetCommandsHandler),
    ]

    base_url = web_app.settings["base_url"]
    handlers = [
        (url_path_join(base_url, namespace, endpoint), handler)
        for endpoint, handler in handlers_with_path
    ]
    web_app.add_handlers(host_pattern, handlers)

    data_dir = jupyter_data_dir()

    global __DATA_REGISTRY__
    __DATA_REGISTRY__ = DataRegistry(data_dir)

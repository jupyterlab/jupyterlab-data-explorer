import json
import traceback

from jupyter_server.base.handlers import APIHandler, JupyterHandler
from jupyter_server.utils import url_path_join
from tornado import web
from tornado.websocket import WebSocketHandler

from .utils import dict_to_snake
from .dataregistry import AlreadyExistsError, DATA_REGISTRY, NotFoundError
from .dataset import Dataset


class RegisterHandler(APIHandler):
    @web.authenticated
    def post(self):
        body = self.get_json_body()
        body = dict_to_snake(body)
        try:
            dataset = Dataset(**body)
            DATA_REGISTRY.register_dataset(dataset)
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
            DATA_REGISTRY.update_dataset(dataset)
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

        datasets = DATA_REGISTRY.query_dataset(
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
            dataset = DATA_REGISTRY.get_dataset(id, version)
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

        DATA_REGISTRY.has_dataset(id, version)
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

            DATA_REGISTRY.register_command(
                command_id=command_id,
                abstract_data_type=abstract_data_type,
                serialization_type=serialization_type,
                storage_type=storage_type,
            )

            self.finish(
                json.dumps(
                    {
                        "message": f"Command with id: {command_id} registered successfully."
                    }
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
        abstract_data_type = self.get_query_argument("abstractDataType", None)
        serialization_type = self.get_query_argument("serializationType", None)
        storage_type = self.get_query_argument("storageType", None)

        if (
            abstract_data_type is None
            or serialization_type is None
            or storage_type is None
        ):
            commands = DATA_REGISTRY.load_all_commands()
        else:
            commands = DATA_REGISTRY.get_commands(
                abstract_data_type=abstract_data_type,
                serialization_type=serialization_type,
                storage_type=storage_type,
            )

        self.finish(json.dumps(commands))


class DataRegistryEventsHandler(JupyterHandler, WebSocketHandler):
    def set_default_headers(self):
        """Undo the set_default_headers in JupyterHandler

        which doesn't make sense for websockets
        """
        pass

    def pre_get(self):
        if self.get_current_user() is None:
            self.log.warning("Couldn't authenticate WebSocket connection")
            raise web.HTTPError(403)

    async def get(self, *args, **kwargs):
        # pre_get can be a coroutine in subclasses
        # assign and yield in two step to avoid tornado 3 issues
        self.pre_get()
        res = super().get(*args, **kwargs)
        await res

    def get_compression_options(self):
        return self.settings.get("websocket_compression_options", None)


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
        ("events", DataRegistryEventsHandler),
    ]

    base_url = web_app.settings["base_url"]
    handlers = [
        (url_path_join(base_url, namespace, endpoint), handler)
        for endpoint, handler in handlers_with_path
    ]
    web_app.add_handlers(host_pattern, handlers)

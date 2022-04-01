import os
import pytest

pytest_plugins = ("jupyter_server.pytest_plugin", )


@pytest.fixture
def jp_server_config(jp_server_config):
    return {"ServerApp": {"jpserver_extensions": {"jupyterlab_dataregistry": True}}}


def empty_dir(dir_path):
    if os.path.exists(dir_path):
        for file in os.listdir(dir_path):
            filepath = os.path.join(dir_path, file)
            if os.path.isfile(filepath):
                os.remove(filepath)
    


@pytest.fixture
def clear_dataregistry(jp_data_dir):
    datasets_dir = os.path.join(jp_data_dir, '.dataregistry', 'datasets')
    commands_dir = os.path.join(jp_data_dir, '.dataregistry', 'commands')

    yield

    empty_dir(datasets_dir)
    empty_dir(commands_dir)

    
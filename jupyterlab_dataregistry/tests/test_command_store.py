import pytest
from unittest.mock import mock_open, patch

from jupyterlab_dataregistry.command_store import CommandStore


@pytest.mark.parametrize(
    "data, adt, sert, stot, command, filename",
    [
        (
            "",
            "tabular",
            "csv",
            "inmemory",
            "command_a",
            "commands/483e27467ea8206400f1e9f90f2a9476",
        ),
        (
            "command_b\n",
            "tabular",
            "csv",
            "inmemory",
            "command_a",
            "commands/483e27467ea8206400f1e9f90f2a9476",
        ),
        (
            "",
            "tabular",
            "csv",
            "s3",
            "command_a",
            "commands/2741f3462d1cb1cc3e36b61a3400dff0",
        ),
    ],
)
@patch("os.path.exists")
def test_add_command(mock_exists, data, adt, sert, stot, command, filename):
    mock_exists.return_value = True
    m = mock_open(read_data=data)

    with patch("jupyterlab_dataregistry.command_store.open", m):
        store = CommandStore("commands")
        store.add_command(
            command_id=command,
            abstract_data_type=adt,
            serialization_type=sert,
            storage_type=stot,
        )
    handle = m()
    m.assert_any_call(filename, "w")
    expected_write = data + command + "\n"
    handle.write.assert_called_once_with(expected_write)

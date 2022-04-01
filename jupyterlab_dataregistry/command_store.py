import hashlib
import os
from typing import List

from .dataset import Dataset


class CommandStore:
    """A file based storage to persist dataset commands"""

    def __init__(self, path):
        self.path = path
        if not os.path.exists(path):
            os.makedirs(path)

    def __create_filename(
        self, abstract_data_type: str, serialization_type: str, storage_type: str
    ) -> str:
        return hashlib.md5(
            f"{abstract_data_type}_{serialization_type}_{storage_type}".encode("utf-8")
        ).hexdigest()

    def add_command(
        self,
        command_id: str,
        abstract_data_type: str,
        storage_type: str,
        serialization_type: str,
    ):
        """Saves the command id to a file"""

        filename = self.__create_filename(
            abstract_data_type, serialization_type, storage_type
        )
        commands = self.get_commands(
            abstract_data_type, storage_type, serialization_type
        )

        if command_id not in commands:
            commands.append(command_id)
            with open(os.path.join(self.path, filename), "w") as f:
                f.write("\n".join(commands) + "\n")

    def get_commands(
        self, abstract_data_type: str, storage_type: str, serialization_type: str
    ) -> List[str]:
        """Reads all commands with specific abstract, storage and serialization types"""

        filename = self.__create_filename(
            abstract_data_type, serialization_type, storage_type
        )
        commands = []
        with open(os.path.join(self.path, filename), "r") as f:
            data = f.read()
            if data:
                commands = data.split("\n")
                
        return [x for x in commands if x] 

import hashlib
import os
from typing import Dict, List


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

    def __create_filename_key(
        self, abstract_data_type: str, serialization_type: str, storage_type: str
    ) -> str:
        return f"{abstract_data_type}_{serialization_type}_{storage_type}"

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
        key = self.__create_filename_key(
            abstract_data_type, serialization_type, storage_type
        )
        commands = self.get_commands(
            abstract_data_type, storage_type, serialization_type
        )

        if command_id not in commands:
            commands.append(command_id)
            commands.insert(0, key)
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
        try:
            with open(os.path.join(self.path, filename), "r") as f:
                data = f.read()
                if data:
                    commands = data.split("\n")
                    commands = commands[1:]
        except FileNotFoundError:
            pass
                
        return [x for x in commands if x] 


    def load_all_commands(self) -> Dict[str, str]:
        """Returns all commands keyed with data type"""

        c = {}
        for file in os.listdir(self.path):
            filepath = os.path.join(self.path, file)
            if os.path.isfile(filepath):
                with open(filepath, "r") as f:
                    data = f.read()

                if data:
                    commands = data.split("\n")
                    key = commands[0]
                    commands = commands[1:]
                    commands = [x for x in commands if x] 
                    c[key] = commands

        return c

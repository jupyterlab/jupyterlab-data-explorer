
from argparse import ArgumentError
import os
from typing import Optional
from .command_store import CommandStore
from .dataset import Dataset

from .dataset_store import DatasetStore


class AlreadyExistsError(Exception):
    def __init__(self, id: str, version: Optional[str] = None):
        self.id = id
        self.version = version

    def __str__(self):
        return f"Dataset with id: {self.id} and version: {self.version} already exists."


class NotFoundError(Exception):
    def __init__(self, id: str, version: Optional[str] = None):
        self.id = id
        self.version = version

    def __str__(self):
        return f"Dataset with id: {self.id} and version: {self.version} not found."


class TypeMismatchError(Exception):
    def __init__(self, type_name: str, actual: str, expected: str):
        self.type_name = type_name
        self.actual = actual
        self.expected = expected

    def __str__(self):
        return f"{self.actual} passed for {self.type_name}, but {self.expected} expected."


class DataRegistry():

    def __init__(self, store_path: str):
        base_path = os.path.join(store_path, ".dataregistry")

        self.__dataset_store = DatasetStore(os.path.join(base_path, "datasets"))
        self.__command_store = CommandStore(os.path.join(base_path, "commands"))

    
    def register_dataset(self, dataset: Dataset):
        dataset_store = self.__dataset_store
        id = dataset.id
        version = dataset.version
        if dataset_store.has_dataset(id, version):
            raise AlreadyExistsError(id, version)
        else:
            dataset_store.save_dataset(dataset)


    def update_dataset(self, dataset: Dataset):
        dataset_store = self.__dataset_store
        id = dataset.id
        version = dataset.version
        
        registered_dataset = dataset_store.load_dataset(id)
        if registered_dataset.abstract_data_type != dataset.abstract_data_type:
            raise TypeMismatchError(
                "abstractDataType",
                dataset.abstract_data_type,
                registered_dataset.abstract_data_type
            )
        
        if registered_dataset.serialization_type != dataset.serialization_type:
            raise TypeMismatchError(
                "serializationType",
                dataset.serialization_type,
                registered_dataset.serialization_type
            )
        
        if registered_dataset.storage_type != dataset.storage_type:
            raise TypeMismatchError(
                "storageType",
                dataset.storage_type,
                registered_dataset.storage_type
            )
        
        if dataset_store.dataset_exists(id, version):
            raise AlreadyExistsError(id, version)
        else:
            dataset_store.save_dataset(dataset)
        

    def get_dataset(self, id, version = None):
        dataset_store = self.__dataset_store
        if dataset_store.has_dataset(id, version):
            dataset = dataset_store.load_dataset(id, version)
        else:
            raise NotFoundError(id, version)

        return dataset


    def query_dataset(
        self, 
        abstract_data_type: str = None, 
        serialization_type: str = None, 
        storage_type: str = None
    ):
        datasets = []
        for dataset in self.__dataset_store.load_all_datasets():
            include = True
            if abstract_data_type:
                include = dataset.abstract_data_type == abstract_data_type

            if serialization_type:
                include = include and dataset.serialization_type == serialization_type

            if storage_type:
                include = include and dataset.storage_type == storage_type

            if include:
                datasets.append(dataset)

        return datasets


    def has_dataset(
        self,
        id: str,
        version: str = None
    ) -> Dataset:  
        dataset = self.__dataset_store.has_dataset(id, version)
        return dataset


    def register_command(
        self,
        command_id: str,
        abstract_data_type: str, 
        serialization_type: str, 
        storage_type: str
    ):
        self.__command_store.add_command(
            command_id, 
            abstract_data_type,
            serialization_type,
            storage_type
        )       


    def get_commands(
        self,
        abstract_data_type: str, 
        serialization_type: str, 
        storage_type: str
    ):
        commands = self.__command_store.get_commands(
            abstract_data_type,
            serialization_type,
            storage_type
        )

        return commands
    
    
import json
from typing import Union, Optional, Dict


class Dataset:
    """Simple object for registering datasets.
    Creating a new dataset in notebook registers the dataset.
    """

    def __init__(
        self,
        id: str,
        abstract_data_type: str,
        serialization_type: str,
        storage_type: str,
        value: Union[str, Dict],
        metadata: Dict,
        title: str,
        description: str,
        tags: Optional[Dict[str, str]] = None,
        version: Optional[str] = None
    ):
        self.id = id
        self.abstract_data_type = abstract_data_type
        self.serialization_type = serialization_type
        self.storage_type = storage_type
        self.value = value
        self.metadata = metadata
        self.title = title
        self.description = description
        self.tags = tags
        self.version = version

    def _repr_mimebundle_(self, include=None, exclude=None):
        dataset = dict(
            id=self.id,
            abstractDataType=self.abstract_data_type,
            serializationType=self.serialization_type,
            storageType=self.storage_type,
            value=self.value,
            metadata=self.metadata,
            title=self.title,
            description=self.description
        )
        if self.tags:
            dataset['tags'] = self.tags

        if self.version:
            dataset['version'] = self.version

        return {
            'application/vnd.jupyter.dataset': json.dumps(dataset)
        }



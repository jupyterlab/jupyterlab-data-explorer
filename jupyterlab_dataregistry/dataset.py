from dataclasses import asdict, dataclass
import json
from typing import Union, Optional, Dict

from .utils import dict_to_camel

@dataclass
class Dataset:
    """Simple object for registering datasets.
    Creating a new dataset in notebook registers the dataset.
    """
    id: str
    abstract_data_type: str
    serialization_type: str
    storage_type: str
    metadata: Dict
    title: str
    description: str
    value: Union[str, Dict] = None
    tags: Optional[Dict[str, str]] = None
    version: Optional[str] = None


    def to_dict(self, camel_case: bool = False):
        dataset = asdict(self, dict_factory=lambda x: {k: v for (k, v) in x if v is not None or k == 'value'})
        return dict_to_camel(dataset) if camel_case else dataset


    def _repr_mimebundle_(self, include=None, exclude=None):
        dataset = self.to_dict(True)

        return {
            'application/vnd.jupyter.dataset': json.dumps(dataset)
        }
    

    


import hashlib
import json
import os
from typing import List
from .dataset import Dataset


class DatasetStore():
    """ A file based storage to persist dataset metadata """

    def __init__(self, path):
        self.path = path    
        if not os.path.exists(path):
            os.makedirs(path)


    def __create_filename(self, id: str) -> str:
        return hashlib.md5(id.encode('utf-8')).hexdigest()


    def save_dataset(self, dataset: Dataset):
        """ Writes the dataset metadata to a file """

        filename = self.__create_filename(dataset.id)
        filepath = os.path.join(self.path, filename)
        datasets = []

        if os.path.exists(filepath):
            with open(os.path.join(self.path, filename), 'r') as f:
                datasets = json.load(f)

        datasets.append(dataset.to_dict())

        with open(os.path.join(self.path, filename), 'w') as f:
            json.dump(datasets, f)


    def load_all_datasets(self) -> List[Dataset]:
        """ Reads all dataset files """

        datasets = []
        for file in os.listdir(self.path):
            filepath = os.path.join(self.path, file)
            if os.path.isfile(filepath):
                with open(filepath, 'r') as f:
                    dataset = json.load(f)
                dataset = dataset[-1]
                datasets.append(Dataset(**dataset))

        return datasets
                

    def has_dataset(self, id: str, version: str = None) -> bool:
        """ Returns True if dataset with version exists """

        filename = self.__create_filename(id)
        
        if os.path.exists(os.path.join(self.path, filename)):
            if version:
                with open(os.path.join(self.path, filename), 'r') as f:
                    datasets = json.load(f)
                    dataset = next((d for d in datasets if d.version == version), None)
                    return True if dataset else False
            else:
                return True
        else:
            return False


    def load_dataset(self, id: str, version: str = None) -> Dataset:
        """ Loads dataset file if exists """
        
        filename = self.__create_filename(id)
        with open(os.path.join(self.path, filename), 'r') as f:
            datasets = json.load(f)
        if version:
            dataset = next((d for d in datasets if d.version == version), None)
        else:
            dataset = datasets[-1]

        return Dataset(**dataset)



    


from argparse import ArgumentError
from contextlib import nullcontext
import json
import pytest
import os
from unittest import mock

from jupyterlab_dataregistry.dataset_store import DatasetStore


dataset_payload_1 = """\
{
    "id": "1",
    "title": "First Dataset",
    "description": "First Dataset Description",
    "abstractDataType": "tabular",
    "serializationType": "csv",
    "storageType": "inmemory",
    "value": "header1,header2\\nvalue1,value2",
    "metadata": {
        "lineDelimiter": "\\n",
        "colDelimiter": ",",
        "headers": true
    }
}
"""

dataset_payload_2 = """\
{
    "id": "2",
    "title": "Second Dataset",
    "description": "Second Dataset Description",
    "abstractDataType": "image",
    "serializationType": "jpg",
    "storageType": "s3",
    "value": null,
    "metadata": {
        "bucket": "my_images",
        "object": "my_image"
    }
}
"""

dataset_payload_3 = """\
{
    "id": "3",
    "title": "Third Dataset",
    "description": "Third Dataset Description",
    "abstractDataType": "tabular",
    "serializationType": "csv",
    "storageType": "s3",
    "value": null,
    "metadata": {
        "bucket": "my_datasets",
        "object": "dataset"
    }
}
"""

async def save_dataset(jp_fetch, dataset):
    r = await jp_fetch(
        "dataregistry",
        "registerDataset",
        method="POST",
        body=dataset
    )
    return r


async def dummy(*args, **kwargs):
    pass


@pytest.mark.parametrize(
    "dataset, expected_status, error, before",
    [
        (
            dataset_payload_1,
            200,
            nullcontext(),
            dummy
        ),
        (
            dataset_payload_1,
            500,
            pytest.raises(Exception, match="HTTP 500: Internal Server Error"),
            save_dataset 
        )
    ]
)
@pytest.mark.usefixtures("clear_dataregistry")
async def test_register_dataset(
    jp_fetch,  
    dataset, 
    expected_status, 
    error,
    before
):
    await before(jp_fetch, dataset)
    with error:        
        r = await save_dataset(jp_fetch, dataset)
        assert r.code == expected_status
        payload = json.loads(r.body)



@pytest.mark.parametrize(
    "before, before_args, params, expected_status, expected_response, error",
    [
        (
            save_dataset,
            dataset_payload_1,
            {'id': '1'},
            200,
            json.loads(dataset_payload_1),
            nullcontext()
        ),
        (
            save_dataset,
            dataset_payload_1,
            {'id': '1', 'version': '1.0'},
            500,
            {},
            pytest.raises(Exception, match="")
        ),
        (
            save_dataset,
            dataset_payload_1,
            {'id': '2'},
            500,
            {},
            pytest.raises(Exception, match="")
        )
    ]
)
@pytest.mark.usefixtures("clear_dataregistry")
async def test_get_dataset(
    jp_fetch,
    before,
    before_args,
    params,
    expected_status,
    expected_response,
    error
):
    await before(jp_fetch, before_args)
    with error:
        r = await jp_fetch(
            "dataregistry",
            "getDataset",
            method="GET",
            params=params
        )
        assert r.code == expected_status
        assert expected_response == json.loads(r.body)



@pytest.mark.parametrize(
    "before, before_args, params, expected_status, expected_response, error",
    [
        (
            save_dataset, 
            (dataset_payload_1, dataset_payload_2, dataset_payload_3),
            {},
            200,
            [json.loads(dataset_payload_1), json.loads(dataset_payload_2), json.loads(dataset_payload_3)],
            nullcontext()
        ),
        (
            save_dataset, 
            (dataset_payload_1, dataset_payload_2, dataset_payload_3),
            {'serializationType': 'csv'},
            200,
            [json.loads(dataset_payload_1), json.loads(dataset_payload_3)],
            nullcontext()
        ),
        (
            save_dataset, 
            (dataset_payload_1, dataset_payload_2, dataset_payload_3),
            {'abstractDataType': 'tabular'},
            200,
            [json.loads(dataset_payload_1), json.loads(dataset_payload_3)],
            nullcontext()
        ),
        (
            save_dataset, 
            (dataset_payload_1, dataset_payload_2, dataset_payload_3),
            {'storageType': 'inmemory'},
            200,
            [json.loads(dataset_payload_1)],
            nullcontext()
        )
    ]
)
@pytest.mark.usefixtures("clear_dataregistry")
async def test_query_dataset(
    jp_fetch,
    before,
    before_args,
    params,
    expected_status,
    expected_response,
    error
):
    for before_arg in before_args:
        await before(jp_fetch, before_arg)

    with error:
        r = await jp_fetch(
            "dataregistry",
            "queryDataset",
            method="GET",
            params=params
        )
        assert r.code == expected_status
        datasets = json.loads(r.body)
        assert expected_response == sorted(datasets, key=lambda d: d['id'])
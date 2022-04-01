import re


def camel_to_snake(s) -> str:
  return re.sub(r'(?<!^)(?=[A-Z])', '_', s).lower()


def snake_to_camel(s) -> str:
    parts = s.split('_')
    if len(parts) > 1:
        return parts[0] + ''.join(x.title() for x in parts[1:])
    
    return s


def dict_to_snake(d):
   if isinstance(d, list):
      return [dict_to_snake(i) if isinstance(i, (dict, list)) else i for i in d]
   return {camel_to_snake(a):dict_to_snake(b) if isinstance(b, (dict, list)) else b for a, b in d.items()}


def dict_to_camel(d):
    if isinstance(d, list):
      return [dict_to_camel(i) if isinstance(i, (dict, list)) else i for i in d]
    return {snake_to_camel(a):dict_to_camel(b) if isinstance(b, (dict, list)) else b for a, b in d.items()}
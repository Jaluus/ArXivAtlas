import os


def load_env_vars() -> None:
    # Load the environment variables from the .env file
    file_dir = os.path.dirname(os.path.realpath(__file__))
    env_path = os.path.join(file_dir, "..", ".env")
    if not os.path.exists(env_path):
        raise FileNotFoundError("The .env file does not exist. Please create one.")

    with open(env_path, "r") as env_file:
        for line in env_file:
            arr = line.split("#")[0].strip().split("=")
            key = arr[0]
            value = "=".join(arr[1:])
            value = value.strip('"')
            os.environ[key] = value

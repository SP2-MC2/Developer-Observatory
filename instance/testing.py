import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding

backend = default_backend()

def generate_key(key_length=32):
  return os.urandom(key_length)

def generate_key_and_iv(key_length=32, iv_length=16):
  return os.urandom(key_length), os.urandom(iv_length)

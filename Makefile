#!make
# MAKEFLAGS += --silent
include .env
export $(shell sed 's/=.*//' .env)

start:
	act --env-file .env -e test/issue.json workflow_dispatch

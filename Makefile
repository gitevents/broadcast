#!make
# MAKEFLAGS += --silent
include .env
export $(shell sed 's/=.*//' .env)

start:
	act

#!/bin/sh

for ((i = 0; i < $1; i++)) do

  result=$(npm test);

  if [ $? != 0 ]; then
    `say "Error in test $i!"`
  fi
  echo "$result"
done

/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include "StringVector.hpp"

#include "Util.hpp"

bool StringVector::equals(std::size_t index, const StringVector& other, std::size_t otherIndex)
{
    if (index >= _tokens.size())
    {
        return false;
    }

    if (otherIndex >= other._tokens.size())
    {
        return false;
    }

    const StringToken& token = _tokens[index];
    const StringToken& otherToken = other._tokens[otherIndex];
    int ret = _string.compare(token._index, token._length, other._string, otherToken._index,
                              otherToken._length);
    return ret == 0;
}

bool StringVector::getUInt32(std::size_t index, const std::string& key, uint32_t& value) const
{
    if (index >= _tokens.size())
    {
        return false;
    }

    const StringToken& token = _tokens[index];

    size_t offset = key.size() + 1;
    if (token._length > offset &&
            _string.compare(token._index, key.size(), key, 0, key.size()) == 0 &&
            _string[token._index + key.size()] == '=')
    {
        value = Util::safe_atoi(&_string[token._index + offset], token._length - offset);
        return value < std::numeric_limits<int>::max();
    }

    return false;
}

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */

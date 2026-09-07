import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check, Search } from "lucide-react";

const SearchableSelect = ({
  options = [],
  value = "all",
  onChange,
  placeholder = "All Names",
  allLabel = "All Names",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync searchQuery when value changes externally
  useEffect(() => {
    if (value === "all" || !value) {
      setSearchQuery("");
    } else {
      setSearchQuery(value);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset input text to current selected value
        if (value === "all" || !value) {
          setSearchQuery("");
        } else {
          setSearchQuery(value);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Filter options based on user input
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelect = (val) => {
    onChange(val);
    if (val === "all") {
      setSearchQuery("");
    } else {
      setSearchQuery(val);
    }
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("all");
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter") {
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (searchQuery === "") {
        handleSelect("all");
      }
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className={`flex items-center justify-between px-3 py-2 border rounded-lg text-sm bg-white cursor-text transition-all ${
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-100"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : value === "all" ? "" : value}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchQuery(value === "all" ? "" : value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value === "all" ? placeholder : value}
          className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 text-sm p-0 pr-1 truncate"
        />

        <div className="flex items-center gap-1 flex-shrink-0">
          {value !== "all" && value !== "" && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="text-gray-400 hover:text-gray-600 p-0.5"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-indigo-600" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-100 py-1 text-sm">
          {/* All option */}
          <button
            type="button"
            onClick={() => handleSelect("all")}
            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50 transition-colors ${
              value === "all"
                ? "bg-indigo-50/70 text-indigo-700 font-semibold"
                : "text-gray-700"
            }`}
          >
            <span>{allLabel}</span>
            {value === "all" && <Check className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Filtered options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50 transition-colors ${
                    isSelected
                      ? "bg-indigo-50/70 text-indigo-700 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0 ml-2" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>No names found</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

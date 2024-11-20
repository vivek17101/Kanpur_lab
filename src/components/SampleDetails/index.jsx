import React, { useContext, useState } from "react";
import { LabContext, LabDispatchContext } from "../../context/LabContext";
import Inputfield from "../Inputfield";

import styles from "./Sample.module.css";

export default function SampleDetails({ ...restProps }) {
  const { sampleDetails } = useContext(LabContext);
  const dispatch = useContext(LabDispatchContext);
  const [isValid, setIsValid] = useState({
    name: {
      status: null,
      message: "",
    },
    CO: {
      status: null,
      message: "",
    },
    dateOfTest: {
      status: null,
      message: "",
    },
    reference: {
      status: null,
      message: "",
    },
  });

  const [input, setInput] = useState(sampleDetails.name || "");
  const [suggestions, setSuggestions] = useState([]);
  
  const names = ['Vivek Gupta', 'Vimal', 'Vikrant', 'Vicky', 'Vasundhara', 'Vivekansh']; // List of names to suggest

  const errorMessages = {
    name: "Supplied by M/s cannot be empty!",
    CO: "C/o cannot be empty!",
    dateOfTest: "All date field should be filled",
    reference: "Reference cannot be empty!",
  };

  const checkValidity = (e) => {
    if (e.target.value.length === 0) {
      setIsValid({
        ...isValid,
        [e.target.id]: {
          status: true,
          message: errorMessages[e.target.id],
        },
      });
    } else {
      setIsValid({ ...isValid, [e.target.id]: { status: false } });
    }
  };

  const onInputChange = (e) => {
    checkValidity(e);
    const { id, value } = e.target;
    if (id === 'name') {
      setInput(value); // Update input field for name
      if (value) {
        // Filter names based on user input
        const filteredNames = names.filter((name) =>
          name.toLowerCase().startsWith(value.toLowerCase())
        );
        setSuggestions(filteredNames); // Set suggestions
      } else {
        setSuggestions([]); // Clear suggestions if input is empty
      }
    }
    dispatch({
      type: "updateSampleDetails",
      payload: { ...sampleDetails, [id]: value },
    });
  };

  const handleSuggestionClick = (name) => {
    setInput(name); // Set the input value to the clicked suggestion
    setSuggestions([]); // Clear the suggestions list
    dispatch({
      type: "updateSampleDetails",
      payload: { ...sampleDetails, name: name }, // Update the sampleDetails with the selected name
    });
  };

  return (
    <section className={styles.container} {...restProps}>
      <h2 className="text--md">Sample Details</h2>
      <form className={styles["form-container"]}>
        <div className={styles["input-group"]}>
          <Inputfield
            name="first-name"
            label="Supplied by M/s"
            value={input}
            placeholder="Enter Supplied by M/s"
            id="name"
            error={isValid.name.status}
            errorMessage={isValid.name.message}
            onChange={onInputChange}
          />
          {suggestions.length > 0 && (
            <ul className={styles.suggestions}>
              {suggestions.map((suggestion, index) => (
                <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Inputfield
          name="C/o:"
          label="C/o:"
          value={sampleDetails.CO}
          placeholder="Enter C/o:"
          id="CO"
          error={isValid.CO.status}
          errorMessage={isValid.CO.message}
          onChange={onInputChange}
        />
        <Inputfield
          type="date"
          name="date-of-test"
          label="Date Of Test"
          value={sampleDetails.dateOfTest}
          id="dateOfTest"
          error={isValid.dateOfTest.status}
          errorMessage={isValid.dateOfTest.message}
          onChange={onInputChange}
        />
        <Inputfield
          name="Nature of Sample"
          label="Nature of Sample"
          value={sampleDetails.reference}
          placeholder="Enter Nature of Sample"
          id="reference"
          error={isValid.reference.status}
          errorMessage={isValid.reference.message}
          onChange={onInputChange}
        />
      </form>
    </section>
  );
}

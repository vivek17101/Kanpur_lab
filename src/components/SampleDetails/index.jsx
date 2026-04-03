import React, { useContext, useState } from "react";
import { LabContext, LabDispatchContext } from "../../context/LabContext";
import InputField from "../InputField";
import styles from "./SampleDetails.module.css";

export default function SampleDetails({ ...restProps }) {
  const { sampleDetails } = useContext(LabContext);
  const dispatch = useContext(LabDispatchContext);

  const [isValid, setIsValid] = useState({
    name: { status: null, message: "" },
    CO: { status: null, message: "" },
    dateOfTest: { status: null, message: "" },
    reference: { status: null, message: "" },
  });

  const [suggestions, setSuggestions] = useState([]);

  const names = [
    "Vivek Gupta",
    "Vimal",
    "Vikrant",
    "Vicky",
    "Vasundhara",
    "Vivekansh",
  ];

  const errorMessages = {
    name: "Supplied by M/s cannot be empty!",
    CO: "C/o cannot be empty!",
    dateOfTest: "Date field should be filled",
    reference: "Nature of Sample cannot be empty!",
  };

  const checkValidity = (id, value) => {
    if (value.length === 0) {
      setIsValid((prev) => ({
        ...prev,
        [id]: { status: true, message: errorMessages[id] },
      }));
    } else {
      setIsValid((prev) => ({ ...prev, [id]: { status: false } }));
    }
  };

  const onInputChange = (e) => {
    const { id, value } = e.target;
    checkValidity(id, value);

    if (id === "name") {
      if (value) {
        const filteredNames = names.filter((name) =>
          name.toLowerCase().startsWith(value.toLowerCase())
        );
        setSuggestions(filteredNames);
      } else {
        setSuggestions([]);
      }
    }

    dispatch({
      type: "updateSampleDetails",
      payload: { ...sampleDetails, [id]: value },
    });
  };

  const handleSuggestionClick = (name) => {
    setSuggestions([]);
    dispatch({
      type: "updateSampleDetails",
      payload: { ...sampleDetails, name },
    });
    setIsValid((prev) => ({ ...prev, name: { status: false } }));
  };

  return (
    <section className={styles.container} {...restProps}>
      <h2 className="text--md">Sample Details</h2>
      <form className={styles["form-container"]}>
        <div className={styles["input-group"]}>
          <InputField
            name="first-name"
            label="Supplied by M/s"
            value={sampleDetails.name}
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

        <InputField
          name="C/o:"
          label="C/o:"
          value={sampleDetails.CO}
          placeholder="Enter C/o:"
          id="CO"
          error={isValid.CO.status}
          errorMessage={isValid.CO.message}
          onChange={onInputChange}
        />
        <InputField
          type="date"
          name="date-of-test"
          label="Date Of Test"
          value={sampleDetails.dateOfTest}
          id="dateOfTest"
          error={isValid.dateOfTest.status}
          errorMessage={isValid.dateOfTest.message}
          onChange={onInputChange}
        />
        <InputField
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

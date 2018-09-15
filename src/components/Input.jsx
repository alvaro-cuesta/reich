import React from 'react'
import PropTypes from 'prop-types'

const Input = ({ label, ...props }) => (
  <label>
    {props.type !== 'checkbox' ? (
      <span className="label noselect">{label}</span>
    ) : null}
    <input {...props} />
    {props.type === 'checkbox' ? (
      <span className="label noselect">{label}</span>
    ) : null}
  </label>
)

Input.propTypes = {
  label: PropTypes.string,
}

export default Input

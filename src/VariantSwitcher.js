import Tippy from "@tippyjs/react";
import styled from "styled-components";

function VariantSwitcher({ mode, activeVariant, onVariantChange }) {
  return (
    <Variants className="drill-maker__variant-switcher">
      {mode.variants.map((variant) => (
        <Tippy key={variant.name} content={variant.name} placement="bottom">
          <Variant
            className={
              "drill-maker__variant" +
              (activeVariant && activeVariant.name === variant.name
                ? " drill-maker__variant--active"
                : "")
            }
            onClick={() => onVariantChange(variant)}
            active={activeVariant && activeVariant.name === variant.name}
            type="button"
            ratio={mode.ratio}
            dangerouslySetInnerHTML={{ __html: variant.background }}
          />
        </Tippy>
      ))}
    </Variants>
  );
}

const Variants = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin: 0 0 8px;
`;

const Variant = styled.button`
  cursor: pointer;
  background: #e6e6e6;
  padding: 5px;
  border: 1px solid #d3d9de;
  outline: none;
  margin: 0 4px 8px;
  opacity: ${(props) => (props.active ? 1 : 0.4)};

  &:hover {
    background: #c2cad0;
  }

  &:focus {
    outline: none;
  }

  svg {
    width: 80px;
    height: ${(props) => props.ratio * 100}px;
  }
`;

export default VariantSwitcher;

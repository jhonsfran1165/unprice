import { useEditor } from '@craftjs/core';
import React, { useMemo } from 'react';

export * from './ToolbarItem';
export * from './ToolbarSection';
export * from './ToolbarDropdown';

export const Toolbar = () => {
  const { selectedNodes, relatedToolbars } = useEditor((state, query) => {
    const selectedNodeIds = query.getEvent('selected').all();
    return {
      selectedNodes: selectedNodeIds,
      relatedToolbars: selectedNodeIds.map(id => state.nodes[id]?.related?.toolbar).filter(Boolean),
    };
  });

  const toolbars = useMemo(() => {
    return relatedToolbars.map((ToolbarComponent, index) => (
      <React.Fragment key={index.toString()}>
        {ToolbarComponent && React.createElement(ToolbarComponent)}
      </React.Fragment>
    ));
  }, [relatedToolbars]);

  if (selectedNodes.length === 0) {
    return (
      <div className="px-5 py-10 flex flex-col items-center justify-center text-center h-full">
        <h2 className="pb-1 text-md">Click on a component to start editing.</h2>
        <p className="text-sm">
          You could also double click on the layers below to edit their names,
          like in Photoshop
        </p>
      </div>
    );
  }

  return (
    <div className="pt-1 h-full">
      {toolbars}
    </div>
  );
};

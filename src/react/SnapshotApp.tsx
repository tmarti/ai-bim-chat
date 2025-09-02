import './css/App.css'
import { useStoreValue } from '../hooks/useStoreValue';
import { resolve } from '../ioc/inversify.config';

function SnapshotApp() {
  const store = resolve('StateStoreService');
  const selectionManager = resolve('SelectionManagerService');
  const referenceManager = resolve('ReferenceManagerService');
  const viewerObjectStateService = resolve('ViewerObjectStateService');
  const viewerCameraControlService = resolve('ViewerCameraControlService');

  const snapshots = useStoreValue(store, state => Array.from(state.snapshots.values()));

  return (
    <div style={{height: '100%', backgroundColor: 'white' }}>
      {snapshots.length > 0 && snapshots.map((s) => (
        <div
          key={s.id}
          className="snapshot-container"
          onMouseEnter={() => {
            const values = s.annotation.getValues();
            s.annotation.setValues({
              ...values,
              markerBGColor: "blue"
            });
            // s.annotation.setLabelShown(true);
          }}
          onMouseLeave={() => {
            const values = s.annotation.getValues();
            s.annotation.setValues({
              ...values,
              markerBGColor: "orange"
            });
            // s.annotation.setLabelShown(false);
          }}
        >
          <span className='snapshot-label'>{s.id} - {s.objectType}</span>
          <div className="snapshot-image-container">
          <img className="snapshot-image"
               src={referenceManager.getImage(s.imageReference) ?? ''}
               onClick={() => {
                viewerObjectStateService.highlightObjects([s.selectedObjectId]);

                selectionManager.select([s.selectedObjectId], "user");
                viewerCameraControlService.flyTo(s.viewpoint);

                }}/>
          </div>
        </div>
      ))}
      {snapshots.length == 0 && (
        <span className="snapshot-placeholder">The snapshots you create will appear here</span>
      )}
    </div>
  )
}

export default SnapshotApp

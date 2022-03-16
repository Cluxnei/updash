import { Modal } from "react-bootstrap";

export default function EditMonitorModal(props) {
    
    return (
        <Modal
          show={props.show}
          onHide={props.onHide}
          dialogClassName="modal-50w"
          aria-labelledby="new-monitor-modal"
        >
          <Modal.Header closeButton className="new-monitor-modal-header">
            <Modal.Title id="new-monitor-modal">
              Edit monitor - {props.monitor.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <form className="w-100 new-monitor-form" onSubmit={props.handleSubmit}>
                <input id="edit-monitor-id" type="hidden" value={props.monitor.id} />

                <div className="new-monitor-form-group">
                    <label className="control-label">Name</label>
                    <div className="col-12">
                        <input 
                            id="edit-monitor-name" 
                            type="text" 
                            className="form-control" 
                            placeholder="Monitor name" 
                            defaultValue={props.monitor.name}
                        />
                    </div>
                </div>

                <div className="new-monitor-form-group">
                    <label className="control-label">URL</label>
                    <div className="col-12">
                        <input 
                            id="edit-monitor-url" 
                            type="url" 
                            className="form-control" 
                            placeholder="http://example.com"
                            defaultValue={props.monitor.url}
                        />
                    </div>
                </div>
                
                <div className="new-monitor-form-group">
                    <label className="control-label">Description</label>
                    <div className="col-12">
                        <textarea 
                            id="edit-monitor-description" 
                            className="form-control" 
                            placeholder="Describe monitor..." 
                            defaultValue={props.monitor.description}
                        />
                    </div>
                </div>

                <div className="new-monitor-form-group">
                    <label className="control-label">Interval</label>
                    <div className="col-12">
                        <select id="edit-monitor-interval" className="form-control" defaultValue={props.monitor.heart_beat_interval}>
                            <option value="30">30 seconds</option>
                            <option value="60">1 minute</option>
                            <option value="300">5 minutes</option>
                            <option value="600">10 minutes</option>
                            <option value="900">15 minutes</option>
                            <option value="1800">30 minutes</option>
                            <option value="3600">1 hour</option>
                            <option value="7200">2 hours</option>
                            <option value="14400">4 hours</option>
                            <option value="28800">8 hours</option>
                            <option value="43200">12 hours</option>
                            <option value="86400">1 day</option>
                            <option value="172800">2 days</option>
                            <option value="345600">4 days</option>
                        </select>
                    </div>
                </div>

                <div className="row w-100">
                    <div className="col-6 p-0">
                        <div className="new-monitor-form-group w-90">
                            <label className="control-label">Fails attemps to DOWN</label>
                            <div className="col-12">
                                <input 
                                    id="edit-monitor-min-attemps-to-down"
                                    type="number" 
                                    className="form-control" 
                                    placeholder="3" 
                                    min={1} 
                                    max={10} 
                                    defaultValue={props.monitor.min_fail_attemps_to_down}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-6 p-0">
                        <div className="new-monitor-form-group w-90">
                            <label className="control-label">Max redirects</label>
                            <div className="col-12">
                                <input 
                                    id="edit-monitor-max-redirects"
                                    type="number" 
                                    className="form-control" 
                                    placeholder="3" 
                                    min={1} 
                                    max={10} 
                                    defaultValue={props.monitor.max_redirects}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            
                
                <div className="row w-100">
                    <div className="col-6 p-0">
                        <div className="new-monitor-form-group w-90">
                            <label className="control-label">Minimum acceptable status code</label>
                            <div className="col-12">
                                <input 
                                    id="edit-monitor-min-acceptable-status-code" 
                                    type="number" 
                                    className="form-control" 
                                    placeholder="200" 
                                    min={1} 
                                    max={500} 
                                    defaultValue={props.monitor.min_acceptable_status_code}
                                />
                            </div>
                        </div>
                    </div>
                
                    <div className="col-6 p-0">
                        <div className="new-monitor-form-group w-90">
                            <label className="control-label">Maximum acceptable status code</label>
                            <div className="col-12">
                                <input 
                                    id="edit-monitor-max-acceptable-status-code" 
                                    type="number" 
                                    className="form-control" 
                                    placeholder="299" 
                                    min={1} 
                                    max={500} 
                                    defaultValue={props.monitor.max_acceptable_status_code}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row w-100">
                    <div className="col-6 p-0">
                        <div className="new-monitor-form-group w-90">
                            <label className="control-label">Type</label>
                            <div className="col-12">
                                <select id="edit-monitor-type" className="form-control" defaultValue={props.monitor.type}>
                                    <option value="http">HTTP</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 p-0">
                        <div className="new-monitor-form-group w-90">
                            <label className="control-label">Method</label>
                            <div className="col-12">
                                <select id="edit-monitor-method" className="form-control" defaultValue={props.monitor.method}>
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                    <option value="HEAD">HEAD</option>
                                    <option value="OPTIONS">OPTIONS</option>
                                    <option value="PATCH">PATCH</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row w-100">
                    <div className="col-6 p-0">
                        <div className="new-monitor-form-group w-90">
                            <label className="control-label">Headers</label>
                            <div className="col-12">
                                <textarea 
                                    id="edit-monitor-headers" 
                                    className="form-control" 
                                    placeholder="Headers" 
                                    defaultValue={props.monitor.headers}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-6 p-0">
                        <div className="new-monitor-form-group w-90">
                            <label className="control-label">Body</label>
                            <div className="col-12">
                                <textarea 
                                    id="edit-monitor-body" 
                                    className="form-control" 
                                    placeholder="Body" 
                                    defaultValue={props.monitor.body}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn btn-success w-100 mt-3">
                    Save
                </button>
                
            </form>
          </Modal.Body>
        </Modal>
    );
  }
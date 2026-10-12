/*
 * Created on 29/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ForecastDataBean extends ShfBaseBean{

	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("WM_DATE", "date");
		fieldsMapping.put("WM_FORECAST_ACTIVITY_ID", "forecastActivity");
		fieldsMapping.put("WM_AVERAGE_HANDLE_TIME", "averageHandle");
		fieldsMapping.put("WM_CALCULATED_STAFFING", "calculatedStaffing");
		fieldsMapping.put("WM_INTERACTION_VOLUME", "interactionVolume");
		fieldsMapping.put("WM_OVERHEADS", "overheads");
		fieldsMapping.put("WM_REQUIRED_STAFFING", "requiredStaffing");
	}
	
	protected Date date;
	protected int forecastActivity;
	protected String averageHandle;
	protected String calculatedStaffing;
	protected String interactionVolume;
	protected String overheads;
	protected String requiredStaffing;
	protected String averageHandleTime;
	
	
	
	
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	/**
	 * @return
	 */
	public String getAverageHandle() {
		return averageHandle;
	}

	/**
	 * @return
	 */
	public String getCalculatedStaffing() {
		return calculatedStaffing;
	}

	/**
	 * @return
	 */
	public Date getDate() {
		return date;
	}

	/**
	 * @return
	 */
	public int getForecastActivity() {
		return forecastActivity;
	}

	/**
	 * @return
	 */
	public String getInteractionVolume() {
		return interactionVolume;
	}

	/**
	 * @return
	 */
	public String getOverheads() {
		return overheads;
	}

	/**
	 * @return
	 */
	public String getRequiredStaffing() {
		return requiredStaffing;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	/**
	 * @param string
	 */
	public void setAverageHandle(String string) {
		averageHandle = string;
	}

	/**
	 * @param string
	 */
	public void setCalculatedStaffing(String string) {
		calculatedStaffing = string;
	}

	/**
	 * @param date
	 */
	public void setDate(Date date) {
		this.date = date;
	}

	/**
	 * @param i
	 */
	public void setForecastActivity(int i) {
		forecastActivity = i;
	}

	/**
	 * @param string
	 */
	public void setInteractionVolume(String string) {
		interactionVolume = string;
	}

	/**
	 * @param string
	 */
	public void setOverheads(String string) {
		overheads = string;
	}

	/**
	 * @param string
	 */
	public void setRequiredStaffing(String string) {
		requiredStaffing = string;
	}
	public String getAverageHandleTime() {
		return averageHandleTime;
	}

	public void setAverageHandleTime(String averageHandleTime) {
		this.averageHandleTime = averageHandleTime;
	}

	

}

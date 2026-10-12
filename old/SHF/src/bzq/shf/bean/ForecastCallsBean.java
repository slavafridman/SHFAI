/*
 * Created on 12/10/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ForecastCallsBean extends ShfBaseBean{

	
	
	protected Date time;
	protected int forecastCallsNum;
	protected int callsNum;
	protected float forecastCallLength;
	protected float callLength;
	protected Vector mokedCallLengthList;
	protected String forecastCallLengthTime;
	protected String callLengthTime;
	protected String gapTime;
	protected float gapFromForecast; 
	
	
	public HashMap getFieldsMapping() {
		return null;
	}
	
	

	


	/**
	 * @return
	 */
	
	public float getCallLength() {
		return callLength;
	}

	public String getForecastCallLengthTime() {
		return forecastCallLengthTime;
	}



	public void setForecastCallLengthTime(String forecastCallLengthTime) {
		this.forecastCallLengthTime = forecastCallLengthTime;
	}



	/**
	 * @return
	 */
	public int getCallsNum() {
		return callsNum;
	}

	/**
	 * @return
	 */
	public float getForecastCallLength() {
		return forecastCallLength;
	}

	/**
	 * @return
	 */
	public int getForecastCallsNum() {
		return forecastCallsNum;
	}

	/**
	 * @return
	 */
	public Vector getMokedCallLengthList() {
		return mokedCallLengthList;
	}

	/**
	 * @return
	 */
	public Date getTime() {
		return time;
	}


	/**
	 * @param f
	 */
	public void setCallLength(float f) {
		callLength = f;
	}

	/**
	 * @param i
	 */
	public void setCallsNum(int i) {
		callsNum = i;
	}

	/**
	 * @param f
	 */
	public void setForecastCallLength(float f) {
		forecastCallLength = f;
	}

	/**
	 * @param i
	 */
	public void setForecastCallsNum(int i) {
		forecastCallsNum = i;
	}

	/**
	 * @param map
	 */
	public void setMokedCallLengthList(Vector vec) {
		mokedCallLengthList = vec;
	}

	/**
	 * @param date
	 */
	public void setTime(Date date) {
		time = date;
	}



	public String getCallLengthTime() {
		return callLengthTime;
	}



	public void setCallLengthTime(String callLengthTime) {
		this.callLengthTime = callLengthTime;
	}



	public String getGapTime() {
		return gapTime;
	}



	public void setGapTime(String gapTime) {
		this.gapTime = gapTime;
	}
	public float getGapFromForecast() {
		return gapFromForecast;
	}



	public void setGapFromForecast(float gapFromForecast) {
		this.gapFromForecast = gapFromForecast;
	}


}

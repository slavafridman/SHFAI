/*
 * Created on 05/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.text.DateFormat;
import java.text.NumberFormat;
import java.util.Date;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.RequestUtils;
import org.apache.struts.util.ResponseUtils;

import bzq.taglib.BaseHandlerTag;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CalendarTag extends BaseHandlerTag {
	
	protected String calname;
	protected String name;
	protected String property;
	protected int marginBottom;
	protected int marginRight;
	protected Date date;
	protected boolean disabled;
	protected String onchange;
	protected boolean disableDays;
	
	

	public int doStartTag() throws JspException {
		String calvalue=null;
		if(name!=null && property!=null){
			Object obj=RequestUtils.lookup(pageContext, name, property, null);
			if(obj instanceof Date){
				date = (Date)obj;
			}else if(obj instanceof String){
				try {
					date = BaseConvert.stringToDate((String)obj,"dd/MM/yyyy");
				} catch (ConvertException e) {
					date = new Date();
				}
			}
			
		}
		if(date==null){
			date=new Date();
		}
		calvalue = BaseConvert.dateToString(date,"dd/MM/yyyy");
		
		
		StringBuffer results = new StringBuffer();
		results.append("<img src=/shf/images/calendar1.gif class=calendarIcon " );		if(!disabled)
			results.append("onclick=document.getElementById('"+calname+"').select();event.cancelBubble=true;lcs(document.getElementById('"+calname+"'),"+marginBottom+","+marginRight+",'"+isDisableDays()+"');" );		results.append("><input type=text class=calendarInput readonly id="+calname+" name="+calname+" value=\""+calvalue+"\" ");
		if(disabled)
			results.append(" readonly style=color:gray; ");
		if(onchange!=null)
			results.append(" "+onchange);		results.append(">");
		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);
	}
	/**
	 * @return
	 */
	public String getCalname() {
		return calname;
	}

	

	/**
	 * @param string
	 */
	public void setCalname(String string) {
		calname = string;
	}

	

	/**
	 * @return
	 */
	public boolean isDisabled() {
		return disabled;
	}

	/**
	 * @param b
	 */
	public void setDisabled(boolean b) {
		disabled = b;
	}

	/**
	 * @return
	 */
	public String getOnchange() {
		return onchange;
	}

	/**
	 * @param string
	 */
	public void setOnchange(String string) {
		onchange = string;
	}

	/**
	 * @return
	 */
	public String getName() {
		return name;
	}

	/**
	 * @return
	 */
	public String getProperty() {
		return property;
	}

	/**
	 * @param string
	 */
	public void setName(String string) {
		name = string;
	}

	/**
	 * @param string
	 */
	public void setProperty(String string) {
		property = string;
	}

	/**
	 * @return
	 */
	public int getMarginBottom() {
		return marginBottom;
	}

	/**
	 * @return
	 */
	public int getMarginRight() {
		return marginRight;
	}

	/**
	 * @param i
	 */
	public void setMarginBottom(int i) {
		marginBottom = i;
	}

	/**
	 * @param i
	 */
	public void setMarginRight(int i) {
		marginRight = i;
	}
	
	public boolean isDisableDays() {
		return disableDays;
	}
	
	public void setDisableDays(boolean disableDays) {
		this.disableDays = disableDays;
	}

}

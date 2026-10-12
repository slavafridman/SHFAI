/*
 * Created on 05/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.util.Calendar;
import java.util.Date;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.RequestUtils;
import org.apache.struts.util.ResponseUtils;

import bzq.shf.utils.DBResource;
import bzq.taglib.BaseHandlerTag;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class TimeChooserTag extends BaseHandlerTag {
	
	protected String inputname;
	protected int inputid;
	protected String inputvalue;
	protected String name;
	protected String property;
	protected boolean disabled;
	
	public int doStartTag() throws JspException {
		
		if(name!=null && property!=null){
			Object obj=RequestUtils.lookup(pageContext, name, property, null);
			if(obj instanceof Date){
				inputvalue = BaseConvert.dateToString((Date)obj,"HH")+":00";
			}else{
				inputvalue = (String)RequestUtils.lookup(pageContext, name, property, null);
			} 
		}
		if(inputvalue == null || inputvalue.length() == 0){
			Calendar cal=Calendar.getInstance();
			inputvalue=cal.get(Calendar.HOUR_OF_DAY)+":00";
		}
		
		String inpid=inputname+inputid;
		StringBuffer results = new StringBuffer();
		results.append("<table cellspacing=0 cellpadding=0 style='border:1px #cccccc solid;'><tr>");
		results.append("<td align=center style='width:15px;' ");
		if(!disabled)
		results.append("onclick=modifyTime('"+inpid+"',1);");
		results.append("><img src='/shf/images/scroller-up.gif'></td>");
		results.append("<td style='font-size=12px;color=#888888'>|</TD>");
		results.append("<td align=center style='width:15px;' ");		if(!disabled)
		results.append("onclick=modifyTime('"+inpid+"',2);");
		results.append("><img src='/shf/images/scroller2-up.gif'></td>");
		results.append("<td><input class=timeInput maxlength=5 name='"+inputname+"' id='"+inpid+"' value='"+inputvalue+"'  ");
		if(disabled)
		results.append(" readonly style=color:gray;");
		results.append("></td>");
		results.append("<td align=center style='width:15px;' ");		if(!disabled)
		results.append("onclick=modifyTime('"+inpid+"',4);");
		results.append("><img src='/shf/images/scroller2-down.gif'></td>");
		results.append("<td style='font-size=12px;color=#888888'>|</TD>");
		results.append("<td align=center style='width:15px;' ");		if(!disabled)
		results.append("onclick=modifyTime('"+inpid+"',3);"); 		results.append("><img src='/shf/images/scroller-down.gif'></td>");
		results.append("</tr></table>");
		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);
	}

	/**
	 * @return
	 */
	public String getInputname() {
		return inputname;
	}

	/**
	 * @param string
	 */
	public void setInputname(String string) {
		inputname = string;
	}

	

	public int getInputid() {
		return inputid;
	}

	public void setInputid(int inputid) {
		this.inputid = inputid;
	}

	/**
	 * @return
	 */
	public String getInputvalue() {
		return inputvalue;
	}

	/**
	 * @param string
	 */
	public void setInputvalue(String string) {
		inputvalue = string;
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

}
